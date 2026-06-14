"""
APScheduler lifecycle for the Cashio application.

Provides start/stop hooks for the async IO scheduler that runs the daily
NAV update job at the configured time and timezone.
"""

from zoneinfo import ZoneInfo

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.repositories.settings import settings
from app.services.auto_nav_update_service import run_daily_nav_update

logger = structlog.get_logger()

scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    """Register the daily NAV update job and start the scheduler.

    Reads configuration from :class:`Settings`:
    - ``SCHEDULER_ENABLED`` — master switch (default ``True``)
    - ``NAV_UPDATE_SCHEDULE_TIME`` — ``HH:MM`` string (default ``05:00``)
    - ``NAV_UPDATE_SCHEDULE_TIMEZONE`` — IANA tz (default ``Europe/London``)

    If the scheduler is disabled or the time string is malformed the
    function logs the outcome and returns without starting.
    """
    if not settings.SCHEDULER_ENABLED:
        logger.info("scheduler_disabled", reason="SCHEDULER_ENABLED=False")
        return

    try:
        hour_str, minute_str = settings.NAV_UPDATE_SCHEDULE_TIME.split(":")
        hour = int(hour_str)
        minute = int(minute_str)
    except (ValueError, TypeError):
        logger.warning(
            "scheduler_invalid_time",
            value=settings.NAV_UPDATE_SCHEDULE_TIME,
            expected_format="HH:MM",
        )
        return

    try:
        tz = ZoneInfo(settings.NAV_UPDATE_SCHEDULE_TIMEZONE)
    except Exception:
        logger.warning(
            "scheduler_invalid_timezone",
            value=settings.NAV_UPDATE_SCHEDULE_TIMEZONE,
        )
        return

    trigger = CronTrigger(hour=hour, minute=minute, timezone=tz)
    scheduler.add_job(
        run_daily_nav_update,
        trigger=trigger,
        id="daily_nav_update",
        misfire_grace_time=900,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()

    logger.info(
        "scheduler_started",
        schedule_time=settings.NAV_UPDATE_SCHEDULE_TIME,
        timezone=settings.NAV_UPDATE_SCHEDULE_TIMEZONE,
    )


def stop_scheduler() -> None:
    """Shut down the scheduler gracefully if it is running."""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("scheduler_stopped")
