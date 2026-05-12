#!/usr/bin/env python3
"""
Cashio Backup CLI — Standalone backup/restore tool.

All pg_dump/psql commands run inside the PostgreSQL container,
so no host-side PostgreSQL client is required.

Usage:
    python backup_cli.py backup
    python backup_cli.py list
    python backup_cli.py restore <filename>
    python backup_cli.py delete <filename>
    python backup_cli.py verify
"""

import argparse
import gzip
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


# ── paths ─────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent       # backend/scripts/
BACKEND_DIR = SCRIPT_DIR.parent                    # backend/
REPO_ROOT = BACKEND_DIR.parent                     # cashio/
DEFAULT_BACKUP_DIR = REPO_ROOT / "backups"


# ── .env parser ───────────────────────────────────────────────────────
def parse_env_file(env_path: Path) -> dict:
    """Read key=value pairs from a .env file (no python-dotenv needed)."""
    env = {}
    if not env_path.exists():
        return env
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            # Strip surrounding quotes
            if len(value) >= 2:
                if value[0] == value[-1] in ('"', "'"):
                    value = value[1:-1]
            env[key] = value
    return env


def load_db_settings() -> dict:
    """Load database settings from .env."""
    env_path = REPO_ROOT / ".env"
    env = parse_env_file(env_path)

    required = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"]
    for key in required:
        if key not in env:
            print(f"ERROR: {key} not found in {env_path}", file=sys.stderr)
            sys.exit(1)

    return {
        "user": env["POSTGRES_USER"],
        "password": env["POSTGRES_PASSWORD"],
        "db": env["POSTGRES_DB"],
        "host": env.get("POSTGRES_HOST", "localhost"),
        "port": env.get("POSTGRES_PORT", "5432"),
    }


def get_backup_dir() -> Path:
    """Determine backup directory from env or default."""
    env_path = REPO_ROOT / ".env"
    env = parse_env_file(env_path)
    raw = env.get("BACKUP_DIR", "")
    if raw:
        backup_dir = Path(raw)
        if not backup_dir.is_absolute():
            backup_dir = REPO_ROOT / backup_dir
    else:
        backup_dir = DEFAULT_BACKUP_DIR
    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir


# ── runtime detection ───────────────────────────────────────────────
_RUNTIME_CACHE: str | None = None


def _detect_runtime() -> str | None:
    """Return 'docker' or 'podman' depending on which is available on PATH."""
    global _RUNTIME_CACHE
    if _RUNTIME_CACHE is not None:
        return _RUNTIME_CACHE
    for runtime in ["docker", "podman"]:
        if shutil.which(runtime):
            _RUNTIME_CACHE = runtime
            return runtime
    return None


def _check_port() -> bool:
    """Check if something is listening on the PostgreSQL port."""
    db = load_db_settings()
    host = db["host"]
    port = int(db["port"])
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3)
    try:
        result = sock.connect_ex((host, port))
        return result == 0
    finally:
        sock.close()


def _container_exec(cmd: list[str], stdin: bytes | None = None) -> subprocess.CompletedProcess:
    """Run a command inside the 'db' container via docker/podman compose exec."""
    if not _check_port():
        print("ERROR: No PostgreSQL server found on port 5432. Start the app first.", file=sys.stderr)
        sys.exit(1)

    runtime = _detect_runtime()
    if runtime is None:
        print("ERROR: Neither docker nor podman found on PATH.", file=sys.stderr)
        sys.exit(1)

    # -T disables TTY allocation (needed for non-interactive piping)
    # docker compose also accepts -T; podman-compose does not have -i
    full_cmd = [runtime, "compose", "exec", "-T", "db"] + cmd
    try:
        return subprocess.run(full_cmd, input=stdin, capture_output=True)
    except FileNotFoundError:
        print(f"ERROR: '{runtime}' command not found.", file=sys.stderr)
        sys.exit(1)


# ── subcommands ──────────────────────────────────────────────────────

def cmd_backup(args: argparse.Namespace) -> None:
    """Create a database backup (.sql.gz)."""
    db = load_db_settings()
    backup_dir = get_backup_dir()

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"cashio_backup_{timestamp}.sql.gz"
    filepath = backup_dir / filename

    print(f"[~] Creating backup: {filename}", file=sys.stderr)

    # pg_dump inside container, capture stdout
    dump_cmd = [
        "pg_dump",
        "-U", db["user"],
        "-d", db["db"],
        "-F", "p",
        "--no-owner",
        "--no-acl",
        "--no-privileges",
    ]
    result = _container_exec(dump_cmd)

    if result.returncode != 0:
        error = result.stderr.decode()
        print(f"ERROR: Backup failed: {error}", file=sys.stderr)
        sys.exit(1)

    # Compress and write
    with open(filepath, "wb") as f:
        f.write(gzip.compress(result.stdout))

    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"[✓] Backup saved: {filename} ({size_mb:.2f} MB)", file=sys.stderr)
    print(filepath)


def _pick_backup(backup_dir: Path) -> Path:
    """Show a numbered list of backups and let the user pick one."""
    files = sorted(backup_dir.glob("*.sql.gz"), reverse=True)
    if not files:
        print("No backup files found.", file=sys.stderr)
        sys.exit(1)

    print("Available backups:", file=sys.stderr)
    for i, f in enumerate(files, 1):
        size = f.stat().st_size
        if size < 1024:
            size_str = f"{size}B"
        elif size < 1024 * 1024:
            size_str = f"{size / 1024:.1f}K"
        else:
            size_str = f"{size / (1024 * 1024):.1f}M"
        mtime = datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(f"  [{i}] {f.name:<50} {size_str:>8}  {mtime}", file=sys.stderr)
    print(file=sys.stderr)

    try:
        choice = input("Enter the number of the backup to restore: ")
    except (EOFError, KeyboardInterrupt):
        print("\nAborted.", file=sys.stderr)
        sys.exit(1)

    try:
        idx = int(choice.strip())
        if idx < 1 or idx > len(files):
            raise ValueError
    except ValueError:
        print("Invalid choice.", file=sys.stderr)
        sys.exit(1)

    return files[idx - 1]


def cmd_restore(args: argparse.Namespace) -> None:
    """Restore database from a .sql.gz backup file."""
    db = load_db_settings()
    backup_dir = get_backup_dir()

    if args.filename:
        filename = args.filename
        filepath = Path(filename)
        if not filepath.is_absolute():
            filepath = backup_dir / filename
        if not filepath.exists():
            print(f"ERROR: File not found: {filepath}", file=sys.stderr)
            sys.exit(1)
    else:
        filepath = _pick_backup(backup_dir)

    if not filepath.name.endswith(".sql.gz"):
        print(f"ERROR: File must have .sql.gz extension: {filepath.name}", file=sys.stderr)
        sys.exit(1)

    # Validate identifiers to prevent SQL injection
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', db["user"]):
        print(f"ERROR: Invalid database username: {db['user']}", file=sys.stderr)
        sys.exit(1)
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', db["db"]):
        print(f"ERROR: Invalid database name: {db['db']}", file=sys.stderr)
        sys.exit(1)

    # Confirm
    if not args.yes:
        print(f"WARNING: This will DESTROY and replace the current database '{db['db']}'.", file=sys.stderr)
        print(f"         Restoring from: {filepath.name}", file=sys.stderr)
        try:
            response = input("Are you sure? Type 'yes' to continue: ")
        except (EOFError, KeyboardInterrupt):
            print("\nAborted.", file=sys.stderr)
            sys.exit(1)
        if response.strip().lower() != "yes":
            print("Aborted.", file=sys.stderr)
            sys.exit(1)

    print(f"[~] Restoring from: {filepath.name}", file=sys.stderr)

    # Step 1: Terminate connections
    print("[~] Terminating existing connections...", file=sys.stderr)
    term_sql = (
        f"SELECT pg_terminate_backend(pg_stat_activity.pid) "
        f"FROM pg_stat_activity "
        f"WHERE pg_stat_activity.datname = '{db['db']}' AND pid <> pg_backend_pid();"
    )
    result = _container_exec(["psql", "-U", db["user"], "-d", "postgres", "-c", term_sql])
    if result.returncode != 0:
        print(f"ERROR: Failed to terminate connections: {result.stderr.decode()}", file=sys.stderr)
        sys.exit(1)

    # Step 2: Drop database
    print("[~] Dropping existing database...", file=sys.stderr)
    result = _container_exec(
        ["psql", "-U", db["user"], "-d", "postgres", "-c", f'DROP DATABASE IF EXISTS "{db["db"]}";']
    )
    if result.returncode != 0:
        print(f"ERROR: Failed to drop database: {result.stderr.decode()}", file=sys.stderr)
        sys.exit(1)

    # Step 3: Create database
    print("[~] Creating fresh database...", file=sys.stderr)
    result = _container_exec(
        ["psql", "-U", db["user"], "-d", "postgres", "-c", f'CREATE DATABASE "{db["db"]}" WITH OWNER = "{db["user"]}";']
    )
    if result.returncode != 0:
        print(f"ERROR: Failed to create database: {result.stderr.decode()}", file=sys.stderr)
        sys.exit(1)

    # Step 4: Restore data
    print("[~] Restoring data...", file=sys.stderr)
    with gzip.open(filepath, "rb") as f:
        sql_data = f.read()
    result = _container_exec(["psql", "-U", db["user"], "-d", db["db"]], stdin=sql_data)
    if result.returncode != 0:
        stderr_out = result.stderr.decode()
        stdout_out = result.stdout.decode()
        error_msg = stderr_out.strip() or stdout_out.strip() or "Unknown error"
        print(f"ERROR: Restore failed:\n{error_msg}", file=sys.stderr)
        sys.exit(1)

    print(f"[✓] Database restored successfully from: {filepath.name}", file=sys.stderr)
    print("[!] Your session has expired. Please log in again.", file=sys.stderr)


def cmd_list(args: argparse.Namespace) -> None:
    """List available backup files."""
    backup_dir = get_backup_dir()
    files = sorted(backup_dir.glob("*.sql.gz"), reverse=True)

    if not files:
        print("No backup files found.")
        return

    print(f"{'Filename':<55} {'Size':>10} {'Date':>20}")
    print("-" * 87)
    for f in files:
        size = f.stat().st_size
        if size < 1024:
            size_str = f"{size}B"
        elif size < 1024 * 1024:
            size_str = f"{size / 1024:.1f}K"
        else:
            size_str = f"{size / (1024 * 1024):.1f}M"
        mtime = datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(f"{f.name:<55} {size_str:>10} {mtime:>20}")


def cmd_delete(args: argparse.Namespace) -> None:
    """Delete a backup file."""
    backup_dir = get_backup_dir()
    filename = args.filename

    filepath = Path(filename)
    if not filepath.is_absolute():
        filepath = backup_dir / filename

    if not filepath.exists():
        print(f"ERROR: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    os.remove(filepath)
    print(f"[✓] Deleted: {filepath.name}", file=sys.stderr)
    print(filepath.name)


def cmd_verify(args: argparse.Namespace) -> None:
    """Verify system prerequisites."""
    print("[~] Verifying system prerequisites...", file=sys.stderr)

    if _check_port():
        print("[✓] PostgreSQL listening on port 5432", file=sys.stderr)
    else:
        print("ERROR: No PostgreSQL server found on port 5432.", file=sys.stderr)
        sys.exit(1)

    runtime = _detect_runtime()
    if runtime:
        print(f"[✓] Container runtime: {runtime}", file=sys.stderr)
    else:
        print("ERROR: Neither docker nor podman found on PATH.", file=sys.stderr)
        sys.exit(1)

    # Check pg_dump version inside container
    result = _container_exec(["pg_dump", "--version"])
    if result.returncode == 0:
        print(f"[✓] pg_dump: {result.stdout.decode().strip()}", file=sys.stderr)
    else:
        print("ERROR: pg_dump not available in container.", file=sys.stderr)
        sys.exit(1)

    # Check psql version
    result = _container_exec(["psql", "--version"])
    if result.returncode == 0:
        print(f"[✓] psql: {result.stdout.decode().strip()}", file=sys.stderr)
    else:
        print("ERROR: psql not available in container.", file=sys.stderr)
        sys.exit(1)

    # Check backup directory disk space
    backup_dir = get_backup_dir()
    try:
        usage = shutil.disk_usage(backup_dir)
        free_gb = usage.free / (1024 ** 3)
        print(f"[✓] Backup directory: {backup_dir} ({free_gb:.1f} GB free)", file=sys.stderr)
    except OSError:
        print(f"[!] Could not check disk space for: {backup_dir}", file=sys.stderr)

    print("[✓] All checks passed.", file=sys.stderr)


# ── main ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Cashio Database Backup Tool — routes through the PostgreSQL container.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # backup
    subparsers.add_parser("backup", help="Create a new database backup (.sql.gz)")

    # restore
    restore_parser = subparsers.add_parser("restore", help="Restore database from a .sql.gz file")
    restore_parser.add_argument("filename", nargs="?", help="Backup filename (in backup dir) or full path. If omitted, shows a list to pick from.")
    restore_parser.add_argument("-y", "--yes", action="store_true", help="Skip confirmation prompt")

    # list
    subparsers.add_parser("list", help="List available backup files")

    # delete
    delete_parser = subparsers.add_parser("delete", help="Delete a backup file")
    delete_parser.add_argument("filename", help="Backup filename (in backup dir) or full path")

    # verify
    subparsers.add_parser("verify", help="Check system prerequisites")

    args = parser.parse_args()

    if args.command == "backup":
        cmd_backup(args)
    elif args.command == "restore":
        cmd_restore(args)
    elif args.command == "list":
        cmd_list(args)
    elif args.command == "delete":
        cmd_delete(args)
    elif args.command == "verify":
        cmd_verify(args)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
