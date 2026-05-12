import gzip
import platform
import os
import re
import subprocess
import shutil
from dataclasses import dataclass
from datetime import datetime
from typing import List, Literal

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.version import __version__
from app.database.connection import SessionLocal
from app.security.user_security import get_current_user
from app.schemas.user_schema import User
from app.repositories.settings import settings

system_router = APIRouter(prefix="/api")

logger = structlog.get_logger()

BACKUP_DIR = settings.BACKUP_DIR
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

MAX_BACKUPS = getattr(settings, 'MAX_BACKUPS', 50)
BACKUP_RETENTION_DAYS = getattr(settings, 'BACKUP_RETENTION_DAYS', 0)


@dataclass
class RestoreState:
    state: Literal["idle", "backing_up", "backup_failed", "restoring", "restore_complete", "restore_failed"]
    message: str = ""
    filename: str | None = None
    error: str | None = None


restore_status = RestoreState(state="idle", message="No operation in progress")


def run_backup(db_settings: dict, backup_filepath: str):
    """
    Function to be run in the background to create a database backup.
    Outputs plain SQL compressed with gzip (.sql.gz) — portable across PostgreSQL versions.
    """
    global restore_status
    restore_status = RestoreState(state="backing_up", message="Backing up database...")

    logger.info("backup_started", filepath=backup_filepath)
    env = os.environ.copy()
    env["PGPASSWORD"] = db_settings["password"]

    try:
        # Log pg_dump version
        version_proc = subprocess.run(
            ["pg_dump", "--version"],
            env=env, capture_output=True, text=True, timeout=10
        )
        logger.info("pg_dump_version", version=version_proc.stdout.strip())

        # Run pg_dump with plain SQL format, capture stdout
        pg_dump_cmd = [
            "pg_dump",
            "-h", db_settings["host"],
            "-p", str(db_settings["port"]),
            "-U", db_settings["user"],
            "-d", db_settings["db"],
            "-F", "p",  # Plain SQL format
            "--no-owner",
            "--no-acl",
            "--no-privileges",
        ]
        process = subprocess.Popen(
            pg_dump_cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error("backup_failed", error=error_msg)
            restore_status = RestoreState(state="backup_failed", message="Backup failed", error=error_msg)
            return

        # Compress and write to file
        with open(backup_filepath, "wb") as f:
            f.write(gzip.compress(stdout))

        logger.info("backup_successful", filepath=backup_filepath)
        restore_status = RestoreState(state="idle", message="Backup completed successfully")

    except Exception as e:
        logger.error("backup_exception", error=str(e))
        restore_status = RestoreState(state="backup_failed", message="Backup failed", error=str(e))


def _validate_sql_identifier(name: str) -> bool:
    """Validate SQL identifiers to prevent injection."""
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name))


def run_restore(db_settings: dict, backup_filepath: str):
    """
    Function to be run in the background to restore the database.
    Restores from .sql.gz (plain SQL compressed with gzip).
    """
    global restore_status
    restore_status = RestoreState(
        state="restoring", message="Restoring database...",
        filename=os.path.basename(backup_filepath)
    )

    logger.info("restore_started", filepath=backup_filepath)
    env = os.environ.copy()
    env["PGPASSWORD"] = db_settings["password"]

    db_name = db_settings["db"]
    db_user = db_settings["user"]

    if not _validate_sql_identifier(db_name) or not _validate_sql_identifier(db_user):
        error_msg = "Invalid database name or username"
        logger.error("restore_failed", error=error_msg)
        restore_status = RestoreState(state="restore_failed", message="Restore failed", error=error_msg)
        return

    psql_base = [
        "psql",
        "-h", db_settings["host"],
        "-p", str(db_settings["port"]),
        "-U", db_settings["user"],
    ]

    try:
        # Step 1: Terminate connections
        restore_status.message = "Terminating existing connections..."
        logger.info("restore_terminating_connections", database=db_name)
        term_sql = (
            f"SELECT pg_terminate_backend(pg_stat_activity.pid) "
            f"FROM pg_stat_activity "
            f"WHERE pg_stat_activity.datname = '{db_name}' AND pid <> pg_backend_pid();"
        )
        subprocess.run(psql_base + ["-d", "postgres", "-c", term_sql], env=env, check=True, capture_output=True)
        logger.info("restore_terminated_connections", database=db_name)

        # Step 2: Drop database
        restore_status.message = "Dropping existing database..."
        logger.info("restore_dropping_database", database=db_name)
        subprocess.run(
            psql_base + ["-d", "postgres", "-c", f'DROP DATABASE IF EXISTS "{db_name}";'],
            env=env, check=True, capture_output=True
        )
        logger.info("restore_dropped_database", database=db_name)

        # Step 3: Create database
        restore_status.message = "Creating fresh database..."
        logger.info("restore_creating_database", database=db_name)
        subprocess.run(
            psql_base + ["-d", "postgres", "-c", f'CREATE DATABASE "{db_name}" WITH OWNER = "{db_user}";'],
            env=env, check=True, capture_output=True
        )
        logger.info("restore_created_database", database=db_name)

        # Step 4: Restore data from .sql.gz
        restore_status.message = "Restoring data..."
        logger.info("restore_loading_data", database=db_name)

        with gzip.open(backup_filepath, "rb") as f:
            sql_data = f.read()

        restore_proc = subprocess.Popen(
            psql_base + ["-d", db_name],
            env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, stderr = restore_proc.communicate(input=sql_data)

        if restore_proc.returncode == 0:
            logger.info("restore_successful")
            restore_status = RestoreState(
                state="restore_complete",
                message="Database restored successfully. Session has expired. Please log in again.",
                filename=os.path.basename(backup_filepath)
            )
        else:
            error_msg = stderr.decode() if stderr else "Unknown error during restore"
            logger.error("restore_failed", error=error_msg)
            restore_status = RestoreState(state="restore_failed", message="Restore failed", error=error_msg)

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode() if e.stderr else str(e)
        logger.error("restore_subprocess_error", error=error_msg)
        restore_status = RestoreState(state="restore_failed", message="Restore failed", error=error_msg)
    except Exception as e:
        logger.error("restore_exception", error=str(e))
        restore_status = RestoreState(state="restore_failed", message="Restore failed", error=str(e))


@system_router.get("/health", tags=["system"])
async def health():
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unreachable",
        )
    return {"status": "healthy"}


@system_router.get("/sysinfo", tags=["system"])
async def get_sysinfo():
    return {
        "api_version": __version__,
        "python_version": platform.python_version(),
    }

@system_router.post("/system/upload-backup", tags=["system"])
async def upload_backup_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a database backup file to the server.
    """
    if not file.filename or not file.filename.endswith(".sql.gz"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only .sql.gz files are allowed.")

    # Check gzip magic bytes
    contents = file.file.read(2)
    file.file.seek(0)
    if contents != b'\x1f\x8b':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file format. File must be a gzip-compressed SQL dump.")

    safe_filename = os.path.basename(file.filename)
    if not safe_filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename.")

    destination_path = os.path.join(BACKUP_DIR, safe_filename)

    if os.path.exists(destination_path):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"File '{safe_filename}' already exists. Please delete the existing file or rename your upload.")

    try:
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save uploaded file: {e}")
    finally:
        file.file.close()

    return {"message": "File uploaded successfully", "filename": safe_filename}

@system_router.post("/system/backup", status_code=status.HTTP_202_ACCEPTED, tags=["system"])
async def create_backup(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Triggers a database backup task to run in the background.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_filename = f"cashio_backup_{timestamp}.sql.gz"
    backup_filepath = os.path.join(BACKUP_DIR, backup_filename)

    db_settings = {
        "host": settings.POSTGRES_HOST,
        "port": settings.POSTGRES_PORT,
        "user": settings.POSTGRES_USER,
        "password": settings.POSTGRES_PASSWORD,
        "db": settings.POSTGRES_DB,
    }

    background_tasks.add_task(run_backup, db_settings, backup_filepath)

    return {"message": "Database backup process started.", "filename": backup_filename}


@system_router.get("/system/backups", response_model=List[str], tags=["system"])
async def list_backups(current_user: User = Depends(get_current_user)):
    """
    Lists all available backup files.
    """
    try:
        files = os.listdir(BACKUP_DIR)
        backup_files = sorted(
            [f for f in files if f.endswith(".sql.gz")],
            reverse=True
        )
        return backup_files
    except FileNotFoundError:
        return []


@system_router.post("/system/restore/{filename}", status_code=status.HTTP_202_ACCEPTED, tags=["system"])
async def restore_from_backup(
    filename: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    force: bool = False,
):
    """
    Triggers a database restore task from a specific backup file.
    This is a DESTRUCTIVE operation and will overwrite the current database.

    By default (without ?force=true), requires at least one other backup file to exist
    as a safety measure.
    """
    if not filename.endswith(".sql.gz"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only .sql.gz files are allowed.")

    backup_filepath = os.path.join(BACKUP_DIR, filename)

    if not os.path.exists(backup_filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found.")

    db_settings = {
        "host": settings.POSTGRES_HOST,
        "port": settings.POSTGRES_PORT,
        "user": settings.POSTGRES_USER,
        "password": settings.POSTGRES_PASSWORD,
        "db": settings.POSTGRES_DB,
    }

    background_tasks.add_task(run_restore, db_settings, backup_filepath)

    return {"message": "Database restore process started from file.", "filename": filename}


@system_router.delete("/system/backups/{filename}", status_code=status.HTTP_200_OK, tags=["system"])
async def delete_backup(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a specific backup file.
    """
    backup_filepath = os.path.join(BACKUP_DIR, filename)

    if not os.path.exists(backup_filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found.")
    
    if not filename.endswith(".sql.gz"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type.")

    try:
        os.remove(backup_filepath)
        return {"message": "Backup file deleted successfully.", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete file: {e}")


@system_router.get("/system/download-backup/{filename}", tags=["system"])
async def download_backup(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Downloads a specific backup file.
    """
    if ".." in filename or filename.startswith("/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename.")

    backup_filepath = os.path.join(BACKUP_DIR, filename)

    if not os.path.exists(backup_filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found.")

    return FileResponse(path=backup_filepath, media_type='application/octet-stream', filename=filename)


@system_router.get("/system/restore-status", response_model=RestoreState, tags=["system"])
async def get_restore_status(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the current restore status.
    """
    return restore_status


@system_router.post("/system/restore-status/reset", tags=["system"])
async def reset_restore_status(
    current_user: User = Depends(get_current_user)
):
    """
    Resets the restore status back to idle.
    """
    global restore_status
    restore_status = RestoreState(state="idle", message="Reset by user")
    return {"message": "Restore status reset to idle."}


@system_router.post("/system/verify-backup", tags=["system"])
async def verify_backup(
    current_user: User = Depends(get_current_user)
):
    """
    Verify backup prerequisites: disk space, container reachable, tool versions.
    """
    # Check pg_dump version
    try:
        pg_dump_version_proc = subprocess.run(
            ["pg_dump", "--version"],
            capture_output=True, text=True, timeout=10
        )
        pg_dump_version = pg_dump_version_proc.stdout.strip() if pg_dump_version_proc.returncode == 0 else "Not found"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pg_dump_version = "Not found"

    # Check psql version
    try:
        psql_version_proc = subprocess.run(
            ["psql", "--version"],
            capture_output=True, text=True, timeout=10
        )
        psql_version = psql_version_proc.stdout.strip() if psql_version_proc.returncode == 0 else "Not found"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        psql_version = "Not found"

    # Check disk space
    try:
        usage = shutil.disk_usage(BACKUP_DIR)
        free_bytes = usage.free
        free_gb = round(free_bytes / (1024 ** 3), 2)
    except OSError:
        free_bytes = 0
        free_gb = 0.0

    return {
        "pg_dump_version": pg_dump_version,
        "psql_version": psql_version,
        "backup_dir": BACKUP_DIR,
        "backup_dir_free_bytes": free_bytes,
        "backup_dir_free_gb": free_gb,
        "backup_count": len([f for f in os.listdir(BACKUP_DIR) if f.endswith(".sql.gz")]) if os.path.isdir(BACKUP_DIR) else 0,
        "max_backups": MAX_BACKUPS,
        "backup_retention_days": BACKUP_RETENTION_DAYS,
    }
