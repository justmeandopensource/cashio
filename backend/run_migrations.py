#!/usr/bin/env python3
"""
Migration Runner Script
Runs SQL migration files in order against the database.
"""

import sys
from pathlib import Path

import structlog
from sqlalchemy import text

from app.database.connection import engine
from app.logging_config import configure_logging
from app.repositories.settings import settings

configure_logging(
    log_level=settings.LOG_LEVEL,
    json_logs=settings.LOG_FORMAT == "json",
)

logger = structlog.get_logger()


def run_migrations():
    """Run all migration files in order."""
    migrations_dir = Path(__file__).parent / "migrations"

    if not migrations_dir.exists():
        logger.error("migrations_dir_not_found")
        return

    migration_files = sorted([f for f in migrations_dir.glob("*.sql")])

    if not migration_files:
        logger.warning("no_migration_files_found")
        return

    logger.info("migrations_found", count=len(migration_files))

    with engine.connect() as conn:
        for migration_file in migration_files:
            logger.info("migration_running", file=migration_file.name)

            try:
                with open(migration_file, 'r') as f:
                    sql_content = f.read()

                conn.execute(text(sql_content))
                conn.commit()
                logger.info("migration_completed", file=migration_file.name)

            except Exception as e:
                error_msg = str(e)
                if any(keyword in error_msg.lower() for keyword in [
                    'already exists', 'duplicate', 'relation', 'constraint'
                ]):
                    logger.info("migration_skipped", file=migration_file.name, reason="already applied")
                    conn.rollback()
                else:
                    logger.error("migration_failed", file=migration_file.name, error=error_msg)
                    conn.rollback()
                    sys.exit(1)

    logger.info("all_migrations_completed")


if __name__ == "__main__":
    run_migrations()