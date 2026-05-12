# Backup & Restore — Cashio

## Backup Format

All backups use **`.sql.gz`** — plain SQL compressed with gzip.

- **Plain SQL** (`pg_dump -F p`): fully portable across PostgreSQL versions. No pg_restore needed.
- **gzip compressed**: small file size with universal tooling (`gunzip`, `gzip -d`, Python `gzip`).

## Backup via UI

1. Go to **Profile → Database Backups**.
2. Click **Create Backup**.
3. Wait for confirmation. The backup file appears in the list.

## Restore via UI

1. Go to **Profile → Database Backups**.
2. Select a backup file and click the **Restore** button.
3. Confirm the destructive operation.
4. When restore completes, a modal appears with **"Go to Login"**.
5. Your session has expired — log in with your credentials.

> ⚠️ Restore overwrites all current data. The safety check requires at least one other backup file to exist (use `?force=true` in the API or the CLI tool to bypass).

## CLI Usage

The `./cashio-backup` wrapper routes all commands through the PostgreSQL container. No host-side PostgreSQL client is needed — only `docker` or `podman`.

```
./cashio-backup backup              Create a backup
./cashio-backup list                List available backups
./cashio-backup restore <file>      Restore from a backup
./cashio-backup delete <file>       Delete a backup
./cashio-backup verify              Check system prerequisites
```

### Disaster Recovery

If you cannot log in (e.g., database corruption, lost credentials):

```bash
./cashio-backup restore cashio_backup_2025-01-01_12-00-00.sql.gz
```

The CLI does **not** require JWT authentication — it connects directly via the container.

## Post-Restore

After a successful restore:

1. Your existing session tokens are invalidated (database changed).
2. A **"Restore Complete"** modal appears in the UI.
3. Click **"Go to Login"** to navigate to the login page and sign in.

## Version Portability

Because backups use plain SQL (`pg_dump -F p`), they work across PostgreSQL versions. You can back up from PostgreSQL 16 and restore to PostgreSQL 18, or vice versa.

## No Host Binaries Needed

All `pg_dump` and `psql` commands run **inside** the PostgreSQL container. The only requirement on the host is `docker` or `podman` with the `compose` plugin.
