"""
NAV fetching service for mutual funds using mfapi.in API
"""

import asyncio
import random
import time
from typing import List, Optional

import httpx
import structlog

from app.schemas.mutual_funds_schema import NavFetchResult

logger = structlog.get_logger(__name__)


class NavService:
    """Service for fetching NAV data from mfapi.in"""

    BASE_URL = "https://api.mfapi.in"
    TIMEOUT = 20.0  # seconds
    RATE_LIMIT_DELAY = 0.2  # seconds between requests; small smoothing only — mfapi.in stalls are per-code, not rate-based
    MAX_ATTEMPTS = 3
    BACKOFF_SCHEDULE = (0.5, 2.0, 8.0)  # seconds per retry; jitter added

    _last_request_at: float = 0.0
    _rate_limit_lock: asyncio.Lock = asyncio.Lock()

    @staticmethod
    async def _await_rate_limit_slot() -> None:
        """Block until at least RATE_LIMIT_DELAY has elapsed since the last
        outbound mfapi.in request. Shared across all callers in this process."""
        async with NavService._rate_limit_lock:
            now = time.monotonic()
            gap = now - NavService._last_request_at
            if gap < NavService.RATE_LIMIT_DELAY:
                await asyncio.sleep(NavService.RATE_LIMIT_DELAY - gap)
            NavService._last_request_at = time.monotonic()

    @staticmethod
    async def fetch_nav_for_scheme(
        scheme_code: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> NavFetchResult:
        """Fetch NAV for a single scheme. If `client` is provided it is reused;
        otherwise a one-shot client is created."""
        if client is not None:
            return await NavService._fetch_with_retry(scheme_code, client)

        async with httpx.AsyncClient(timeout=NavService.TIMEOUT) as owned:
            return await NavService._fetch_with_retry(scheme_code, owned)

    @staticmethod
    async def _fetch_with_retry(
        scheme_code: str, client: httpx.AsyncClient
    ) -> NavFetchResult:
        url = f"{NavService.BASE_URL}/mf/{scheme_code}/latest"
        last_error = "unknown error"

        for attempt in range(NavService.MAX_ATTEMPTS):
            await NavService._await_rate_limit_slot()
            started = time.monotonic()
            try:
                response = await client.get(url, timeout=NavService.TIMEOUT)
                elapsed = time.monotonic() - started

                if response.status_code == 404:
                    logger.info(
                        "nav_fetch_not_found",
                        scheme_code=scheme_code,
                        elapsed_ms=int(elapsed * 1000),
                    )
                    return NavFetchResult(
                        scheme_code=scheme_code,
                        success=False,
                        error_message="Scheme code not found",
                    )

                if response.status_code in (429, 503):
                    retry_after = response.headers.get("Retry-After")
                    last_error = f"HTTP {response.status_code}"
                    logger.warning(
                        "nav_fetch_throttled",
                        scheme_code=scheme_code,
                        status=response.status_code,
                        attempt=attempt + 1,
                        elapsed_ms=int(elapsed * 1000),
                        retry_after=retry_after,
                    )
                    await NavService._sleep_backoff(attempt, retry_after)
                    continue

                response.raise_for_status()
                data = response.json()
                nav_data = data.get("data", [])
                if not nav_data:
                    logger.info(
                        "nav_fetch_empty",
                        scheme_code=scheme_code,
                        elapsed_ms=int(elapsed * 1000),
                    )
                    return NavFetchResult(
                        scheme_code=scheme_code,
                        success=False,
                        error_message="No NAV data available",
                    )

                latest_nav_entry = nav_data[0]
                fund_name = data.get("meta", {}).get("scheme_name", "")
                logger.info(
                    "nav_fetch_success",
                    scheme_code=scheme_code,
                    attempt=attempt + 1,
                    elapsed_ms=int(elapsed * 1000),
                )
                return NavFetchResult(
                    scheme_code=scheme_code,
                    fund_name=fund_name,
                    nav_value=float(latest_nav_entry.get("nav", 0)),
                    nav_date=latest_nav_entry.get("date"),
                    success=True,
                )

            except httpx.ConnectTimeout:
                elapsed = time.monotonic() - started
                last_error = "connect timeout"
                logger.warning(
                    "nav_fetch_connect_timeout",
                    scheme_code=scheme_code,
                    attempt=attempt + 1,
                    elapsed_ms=int(elapsed * 1000),
                )
                await NavService._sleep_backoff(attempt)
            except httpx.ReadTimeout:
                elapsed = time.monotonic() - started
                last_error = "read timeout"
                logger.warning(
                    "nav_fetch_read_timeout",
                    scheme_code=scheme_code,
                    attempt=attempt + 1,
                    elapsed_ms=int(elapsed * 1000),
                )
                await NavService._sleep_backoff(attempt)
            except httpx.TimeoutException:
                elapsed = time.monotonic() - started
                last_error = "timeout"
                logger.warning(
                    "nav_fetch_timeout",
                    scheme_code=scheme_code,
                    attempt=attempt + 1,
                    elapsed_ms=int(elapsed * 1000),
                )
                await NavService._sleep_backoff(attempt)
            except httpx.HTTPStatusError as e:
                elapsed = time.monotonic() - started
                logger.warning(
                    "nav_fetch_http_error",
                    scheme_code=scheme_code,
                    status=e.response.status_code,
                    elapsed_ms=int(elapsed * 1000),
                )
                return NavFetchResult(
                    scheme_code=scheme_code,
                    success=False,
                    error_message=f"HTTP {e.response.status_code}: {e.response.text}",
                )
            except httpx.HTTPError as e:
                elapsed = time.monotonic() - started
                last_error = f"http error: {e.__class__.__name__}"
                logger.warning(
                    "nav_fetch_http_transport_error",
                    scheme_code=scheme_code,
                    attempt=attempt + 1,
                    elapsed_ms=int(elapsed * 1000),
                    error_class=e.__class__.__name__,
                )
                await NavService._sleep_backoff(attempt)
            except Exception as e:
                elapsed = time.monotonic() - started
                logger.error(
                    "nav_fetch_unexpected_error",
                    scheme_code=scheme_code,
                    elapsed_ms=int(elapsed * 1000),
                    error=str(e),
                )
                return NavFetchResult(
                    scheme_code=scheme_code, success=False, error_message=str(e)
                )

        logger.warning(
            "nav_fetch_exhausted",
            scheme_code=scheme_code,
            attempts=NavService.MAX_ATTEMPTS,
            last_error=last_error,
        )
        return NavFetchResult(
            scheme_code=scheme_code,
            success=False,
            error_message=f"Failed after {NavService.MAX_ATTEMPTS} attempts: {last_error}",
        )

    @staticmethod
    async def _sleep_backoff(
        attempt: int, retry_after: Optional[str] = None
    ) -> None:
        if attempt >= NavService.MAX_ATTEMPTS - 1:
            return
        if retry_after is not None:
            try:
                await asyncio.sleep(min(float(retry_after), 30.0))
                return
            except ValueError:
                pass
        base = NavService.BACKOFF_SCHEDULE[
            min(attempt, len(NavService.BACKOFF_SCHEDULE) - 1)
        ]
        await asyncio.sleep(base + random.uniform(0, 0.3))

    @staticmethod
    async def fetch_nav_bulk(scheme_codes: List[str]) -> List[NavFetchResult]:
        """Fetch NAV for multiple scheme codes sequentially over one shared client."""
        results: List[NavFetchResult] = []
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        bulk_started = time.monotonic()

        async with httpx.AsyncClient(
            timeout=NavService.TIMEOUT, limits=limits
        ) as client:
            for scheme_code in scheme_codes:
                result = await NavService.fetch_nav_for_scheme(scheme_code, client)
                results.append(result)

        elapsed = time.monotonic() - bulk_started
        succeeded = sum(1 for r in results if r.success)
        logger.info(
            "nav_fetch_bulk_complete",
            total=len(scheme_codes),
            succeeded=succeeded,
            failed=len(scheme_codes) - succeeded,
            elapsed_ms=int(elapsed * 1000),
        )
        return results

    @staticmethod
    def fetch_nav_bulk_sync(scheme_codes: List[str]) -> List[NavFetchResult]:
        """Synchronous wrapper for bulk NAV fetching."""

        async def run_async():
            return await NavService.fetch_nav_bulk(scheme_codes)

        try:
            import nest_asyncio  # type: ignore[import]

            nest_asyncio.apply()
        except ImportError:
            pass

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(run_async())
        finally:
            loop.close()
