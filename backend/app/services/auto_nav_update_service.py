"""
Daily NAV update job that runs on a schedule (via APScheduler).

Iterates over every ledger that has mutual funds, picks the correct NAV
source per ledger (India → mfapi.in, UK → Yahoo Finance), fetches NAVs,
retries only transient failures, and persists results to the database.

A Postgres advisory lock guards the job so that running multiple uvicorn
workers (or firing a manual trigger while the schedule is running) still
results in exactly one in-flight execution.
"""

from __future__ import annotations

import asyncio
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional

import structlog
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.model import Ledger, MutualFund
from app.repositories.mutual_fund_crud import bulk_update_mutual_fund_navs
from app.schemas.mutual_funds_schema import BulkNavUpdateItem, NavFetchResult
from app.services.nav_fetch_helpers import (
    DEFAULT_BASE_BACKOFF_S,
    DEFAULT_MAX_RETRIES,
    NavFetcher,
    fetch_with_retry,
    fetcher_for,
)

logger = structlog.get_logger()

# Arbitrary stable key so every replica of this app picks the same lock slot.
_ADVISORY_LOCK_KEY = 7501832749113311  # int8, must fit in bigint


# ---------- Status tracking ----------

@dataclass
class LedgerRunResult:
    ledger_id: int
    ledger_name: Optional[str]
    total_funds: int
    updated: int
    failed: int
    skipped_no_code: int


@dataclass
class JobRunState:
    """Snapshot of the most-recent (or in-progress) NAV update run."""

    status: str = "idle"  # idle | running | success | partial | failed | skipped_locked
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    triggered_by: Optional[str] = None  # "schedule" or "manual"
    total_ledgers: int = 0
    total_funds: int = 0
    total_updated: int = 0
    total_failed: int = 0
    error: Optional[str] = None
    ledgers: List[LedgerRunResult] = field(default_factory=list)


_state_lock = threading.Lock()
_state = JobRunState()


def get_last_run_state() -> JobRunState:
    """Return a copy of the most-recent job run state (thread-safe snapshot)."""
    with _state_lock:
        # Shallow-copy the dataclass; LedgerRunResult entries are immutable enough
        return JobRunState(
            status=_state.status,
            started_at=_state.started_at,
            finished_at=_state.finished_at,
            triggered_by=_state.triggered_by,
            total_ledgers=_state.total_ledgers,
            total_funds=_state.total_funds,
            total_updated=_state.total_updated,
            total_failed=_state.total_failed,
            error=_state.error,
            ledgers=list(_state.ledgers),
        )


def _set_state(**kwargs) -> None:
    with _state_lock:
        for key, value in kwargs.items():
            setattr(_state, key, value)


# ---------- Database helpers ----------

def _try_acquire_advisory_lock(db: Session) -> bool:
    """Attempt to acquire a Postgres session-scoped advisory lock.

    Returns True if acquired (and the same session must be kept open until
    the work is done — the lock is released when the session closes).
    """
    row = db.execute(
        text("SELECT pg_try_advisory_lock(:k)"),
        {"k": _ADVISORY_LOCK_KEY},
    ).scalar()
    return bool(row)


def _release_advisory_lock(db: Session) -> None:
    try:
        db.execute(
            text("SELECT pg_advisory_unlock(:k)"), {"k": _ADVISORY_LOCK_KEY}
        )
        db.commit()
    except Exception:
        logger.exception("nav_update_lock_release_failed")


def _load_ledgers_and_funds(
    db: Session,
) -> list[tuple[int, Optional[str], str, list[MutualFund]]]:
    """Pre-load everything we need so we can close the session before doing I/O.

    Returns a list of (ledger_id, ledger_name, nav_service_type, funds).
    """
    ledgers: list[Ledger] = (
        db.query(Ledger)
        .join(MutualFund, Ledger.ledger_id == MutualFund.ledger_id)
        .distinct()
        .all()
    )
    out: list[tuple[int, Optional[str], str, list[MutualFund]]] = []
    for ledger in ledgers:
        funds = (
            db.query(MutualFund)
            .filter(MutualFund.ledger_id == ledger.ledger_id)
            .all()
        )
        # Detach from session so we can safely use them after .close().
        for f in funds:
            db.expunge(f)
        out.append(
            (
                int(ledger.ledger_id),  # type: ignore[arg-type]
                getattr(ledger, "name", None),
                str(ledger.nav_service_type),  # type: ignore[arg-type]
                funds,
            )
        )
    return out


# ---------- Per-ledger processing ----------

async def _process_ledger(
    ledger_id: int,
    ledger_name: Optional[str],
    nav_service_type: str,
    funds: list[MutualFund],
    fetcher_override: Optional[NavFetcher] = None,
) -> LedgerRunResult:
    funds_with_code = [f for f in funds if f.code]
    skipped_names = [f.name for f in funds if not f.code]

    if skipped_names:
        logger.warning(
            "nav_update_funds_skipped_no_code",
            ledger_id=ledger_id,
            fund_names=skipped_names,
        )

    if not funds_with_code:
        logger.info("nav_update_no_funds_with_code", ledger_id=ledger_id)
        return LedgerRunResult(
            ledger_id=ledger_id,
            ledger_name=ledger_name,
            total_funds=0,
            updated=0,
            failed=0,
            skipped_no_code=len(skipped_names),
        )

    # Fan-out: multiple funds can share the same scheme code (e.g. one per
    # owner). Keep a list per code so each fund row gets its NAV updated.
    scheme_to_funds: dict[str, list[MutualFund]] = {}
    for f in funds_with_code:
        assert f.code is not None
        scheme_to_funds.setdefault(str(f.code), []).append(f)

    unique_codes = list(scheme_to_funds.keys())
    fetcher = fetcher_override or fetcher_for(nav_service_type)
    nav_results = await fetch_with_retry(
        unique_codes,
        fetcher,
        max_retries=DEFAULT_MAX_RETRIES,
        base_backoff_s=DEFAULT_BASE_BACKOFF_S,
    )

    update_items: List[BulkNavUpdateItem] = []
    failed_codes: List[str] = []

    for result in nav_results:
        target_funds = scheme_to_funds.get(result.scheme_code, [])
        if not target_funds:
            continue
        if (
            result.success
            and result.nav_value is not None
            and result.nav_date is not None
        ):
            for fund in target_funds:
                update_items.append(
                    BulkNavUpdateItem(
                        mutual_fund_id=fund.mutual_fund_id,  # type: ignore[arg-type]
                        latest_nav=result.nav_value,
                        nav_date=result.nav_date,
                    )
                )
        else:
            failed_codes.append(result.scheme_code)

    updated_count = 0
    if update_items:
        # Persist in a short-lived session so we don't hold a connection
        # during the prior HTTP I/O.
        loop = asyncio.get_event_loop()

        def _persist() -> int:
            with SessionLocal() as write_db:
                ids = bulk_update_mutual_fund_navs(write_db, update_items)
                return len(ids)

        updated_count = await loop.run_in_executor(None, _persist)

    log_kwargs = dict(
        ledger_id=ledger_id,
        total=len(funds_with_code),
        updated=updated_count,
        failed=len(failed_codes),
    )
    if updated_count:
        logger.info("nav_update_ledger_complete", **log_kwargs)
    else:
        logger.warning("nav_update_ledger_all_failed", **log_kwargs)

    return LedgerRunResult(
        ledger_id=ledger_id,
        ledger_name=ledger_name,
        total_funds=len(funds_with_code),
        updated=updated_count,
        failed=len(failed_codes),
        skipped_no_code=len(skipped_names),
    )


# ---------- Public entry points ----------

async def run_daily_nav_update(triggered_by: str = "schedule") -> JobRunState:
    """Update NAVs for every mutual fund across every ledger.

    Acquires a Postgres advisory lock so only one instance of the job runs
    at a time across the entire cluster. Returns the resulting
    :class:`JobRunState`.
    """
    started = datetime.now(timezone.utc)

    lock_db = SessionLocal()
    try:
        if not _try_acquire_advisory_lock(lock_db):
            logger.info("nav_update_skipped_lock_held", triggered_by=triggered_by)
            _set_state(
                status="skipped_locked",
                started_at=started,
                finished_at=datetime.now(timezone.utc),
                triggered_by=triggered_by,
                error="another instance is already running",
                ledgers=[],
                total_ledgers=0,
                total_funds=0,
                total_updated=0,
                total_failed=0,
            )
            return get_last_run_state()

        logger.info("nav_update_job_started", triggered_by=triggered_by)
        _set_state(
            status="running",
            started_at=started,
            finished_at=None,
            triggered_by=triggered_by,
            error=None,
            ledgers=[],
            total_ledgers=0,
            total_funds=0,
            total_updated=0,
            total_failed=0,
        )

        # Snapshot ledger/fund data, then close the read session.
        try:
            with SessionLocal() as read_db:
                ledger_specs = _load_ledgers_and_funds(read_db)
        except Exception as exc:
            logger.exception("nav_update_load_failed")
            _set_state(
                status="failed",
                finished_at=datetime.now(timezone.utc),
                error=str(exc),
            )
            return get_last_run_state()

        if not ledger_specs:
            logger.info("nav_update_no_ledgers_with_funds")
            _set_state(
                status="success",
                finished_at=datetime.now(timezone.utc),
            )
            return get_last_run_state()

        results: List[LedgerRunResult] = []
        for ledger_id, ledger_name, nav_service_type, funds in ledger_specs:
            try:
                res = await _process_ledger(
                    ledger_id, ledger_name, nav_service_type, funds
                )
            except Exception:
                logger.exception(
                    "nav_update_ledger_failed", ledger_id=ledger_id
                )
                res = LedgerRunResult(
                    ledger_id=ledger_id,
                    ledger_name=ledger_name,
                    total_funds=len([f for f in funds if f.code]),
                    updated=0,
                    failed=len([f for f in funds if f.code]),
                    skipped_no_code=len([f for f in funds if not f.code]),
                )
            results.append(res)

        total_funds = sum(r.total_funds for r in results)
        total_updated = sum(r.updated for r in results)
        total_failed = sum(r.failed for r in results)

        if total_updated == 0 and total_funds > 0:
            status = "failed"
        elif total_failed > 0:
            status = "partial"
        else:
            status = "success"

        _set_state(
            status=status,
            finished_at=datetime.now(timezone.utc),
            ledgers=results,
            total_ledgers=len(results),
            total_funds=total_funds,
            total_updated=total_updated,
            total_failed=total_failed,
        )
        logger.info(
            "nav_update_job_completed",
            status=status,
            ledgers=len(results),
            total_funds=total_funds,
            updated=total_updated,
            failed=total_failed,
        )
        return get_last_run_state()

    except Exception as exc:
        logger.exception("nav_update_job_failed")
        _set_state(
            status="failed",
            finished_at=datetime.now(timezone.utc),
            error=str(exc),
        )
        return get_last_run_state()
    finally:
        _release_advisory_lock(lock_db)
        lock_db.close()


_manual_trigger_lock = asyncio.Lock()
_manual_task: Optional[asyncio.Task] = None


async def trigger_manual_run() -> JobRunState:
    """Kick off ``run_daily_nav_update`` if no run is in flight.

    Returns the current :class:`JobRunState`. Callers should poll
    :func:`get_last_run_state` to observe progress.
    """
    global _manual_task

    async with _manual_trigger_lock:
        if _manual_task is not None and not _manual_task.done():
            return get_last_run_state()

        loop = asyncio.get_event_loop()
        _manual_task = loop.create_task(run_daily_nav_update(triggered_by="manual"))

    return get_last_run_state()
