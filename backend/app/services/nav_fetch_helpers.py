"""
Shared NAV-fetching helpers used by both the manual ``bulk-fetch-nav``
endpoint and the daily auto-update job.

The two callers used to have divergent retry behaviour (the endpoint had
none, the job had a bespoke loop). This module centralises:

- :func:`fetcher_for` — picks the right NAV service per ledger type.
- :func:`is_transient` — classifies a failed :class:`NavFetchResult` as
  worth-retrying or permanent.
- :func:`fetch_with_retry` — runs a fetcher with transient-only retries,
  exponential backoff, and jitter.
"""

from __future__ import annotations

import asyncio
import random
from typing import Awaitable, Callable, List

import structlog

from app.schemas.mutual_funds_schema import NavFetchResult
from app.services.nav_service import NavService
from app.services.yahoo_nav_service import YahooNavService

logger = structlog.get_logger()

DEFAULT_MAX_RETRIES = 3
DEFAULT_BASE_BACKOFF_S = 1.0

# Substrings (lowercase) in error_message that indicate a transient failure.
_TRANSIENT_HINTS = (
    "timeout",
    "timed out",
    "connection",
    "temporarily",
    "rate limit",
    "429",
    "502",
    "503",
    "504",
    "no quote data available",  # Yahoo intermittent
    "remote disconnected",
)

# Substrings (lowercase) that mark a failure as permanent (skip retry).
_PERMANENT_HINTS = (
    "not found",
    "no nav data available",
    "http 400",
    "http 401",
    "http 403",
    "http 404",
    "http 410",
    "http 422",
)

NavFetcher = Callable[[List[str]], Awaitable[List[NavFetchResult]]]


def fetcher_for(nav_service_type: str) -> NavFetcher:
    """Return the bulk-fetch coroutine for a ledger's NAV source."""
    if nav_service_type == "uk":
        return YahooNavService.fetch_nav_bulk
    return NavService.fetch_nav_bulk


def default_max_retries_for(nav_service_type: str, default: int = DEFAULT_MAX_RETRIES) -> int:
    """How many orchestration-layer retries to use for this NAV source.

    ``NavService`` (India) already retries per scheme inside the service
    with its own backoff schedule and process-wide rate limit, so
    orchestration retries on top would multiply latency on bad upstreams.
    ``YahooNavService`` (UK) has no internal retry, so the orchestration
    layer is the only thing protecting against transient Yahoo failures.
    """
    if nav_service_type == "uk":
        return default
    return 0


def is_transient(result: NavFetchResult) -> bool:
    """Decide whether a failed :class:`NavFetchResult` is worth retrying.

    Successful results never retry. Empty error messages are treated as
    transient (so we don't silently drop on unknown failure modes).
    """
    if result.success:
        return False
    msg = (result.error_message or "").lower()
    if not msg:
        return True
    if any(hint in msg for hint in _PERMANENT_HINTS):
        return False
    return any(hint in msg for hint in _TRANSIENT_HINTS)


async def fetch_with_retry(
    scheme_codes: List[str],
    fetcher: NavFetcher,
    max_retries: int = DEFAULT_MAX_RETRIES,
    base_backoff_s: float = DEFAULT_BASE_BACKOFF_S,
) -> List[NavFetchResult]:
    """Fetch NAV for *scheme_codes*, retrying only transient failures.

    The fetcher is expected to return one :class:`NavFetchResult` per
    input code (both ``NavService`` and ``YahooNavService`` honour this).
    Successful and permanent-failure results are kept verbatim. Only
    transient failures are re-fetched on the next attempt.
    """
    if not scheme_codes:
        return []

    final: dict[str, NavFetchResult] = {}
    remaining: List[str] = list(scheme_codes)

    for attempt in range(max_retries + 1):
        results = await fetcher(remaining)
        by_code = {r.scheme_code: r for r in results}

        next_remaining: List[str] = []
        for code in remaining:
            r = by_code.get(code)
            if r is None:
                r = NavFetchResult(
                    scheme_code=code,
                    success=False,
                    error_message="no result returned by NAV service",
                )
            final[code] = r
            if not r.success and is_transient(r) and attempt < max_retries:
                next_remaining.append(code)

        if not next_remaining:
            break

        delay = base_backoff_s * (2 ** attempt) + random.uniform(0, 0.3)
        logger.info(
            "nav_fetch_retry",
            attempt=attempt + 1,
            retry_count=len(next_remaining),
            delay_s=round(delay, 2),
        )
        await asyncio.sleep(delay)
        remaining = next_remaining

    return list(final.values())
