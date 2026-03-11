# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cashio is a full-stack personal finance management application. It is a monorepo with a Python/FastAPI backend, a React/TypeScript frontend, and PostgreSQL as the database.

## Development Commands

### Primary CLI: `cashio-stack`

All service management goes through the `./cashio-stack` script at the repo root.

```bash
# Local development (hot-reload, recommended)
./cashio-stack start-local             # Start backend + frontend with HMR
./cashio-stack start-local-backend    # FastAPI dev server only (localhost:8000)
./cashio-stack start-local-frontend   # Vite dev server only (localhost:5173)

# Dockerized services
./cashio-stack build [db|backend|frontend|all]
./cashio-stack start [service]
./cashio-stack stop [service]
./cashio-stack restart [service]
./cashio-stack down [service]
./cashio-stack logs [service]
./cashio-stack status
```

### Frontend (`frontend/`)

```bash
npm run dev       # Vite dev server
npm run build     # Production bundle
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`backend/`)

```bash
python -m app.main          # Start FastAPI with auto-reload
python run_migrations.py    # Run SQL migrations
```

### Versioning

```bash
./release 1.2.3   # Updates VERSION, package.json, version.ts, version.py; creates git tag
```

## Architecture

### Backend (FastAPI, layered)

```
backend/app/
├── main.py          # App init, CORS, router registration
├── routers/         # HTTP handlers (thin layer, delegate to services)
├── services/        # Business logic
├── repositories/    # Data access (CRUD via SQLAlchemy)
├── models/          # SQLAlchemy ORM entities
├── schemas/         # Pydantic request/response models
├── security/        # JWT authentication
├── database/        # DB connection, session via get_db() dependency
└── utils/
```

The 10 feature domains are: `user`, `ledger`, `account`, `transaction`, `category`, `tag`, `physical_assets`, `mutual_funds`, `insights`, `system`. Each domain has a corresponding router, service, repository, and schema module.

Database tables are auto-created from SQLAlchemy models on startup. SQL migration files live in `backend/migrations/` and are applied with `run_migrations.py`.

### Frontend (React + TypeScript, feature-based)

```
frontend/src/
├── App.tsx          # Router setup with lazy-loaded feature pages
├── config.ts        # API base URL config
├── lib/             # Axios instance with JWT injection
├── components/      # Shared UI components
└── features/        # auth, home, ledger, account, transactions,
                     #   categories, physical-assets, mutual-funds,
                     #   insights, profile
```

**Data flow:** Axios (`lib/`) → React Query (server state, 5min stale/10min GC) → Zustand (local client state) → Chakra UI components.

Protected routes require JWT; the axios instance injects the bearer token from Zustand store automatically.

### Infrastructure

- Docker Compose runs three services: `db` (PostgreSQL), `backend` (port 8000), `frontend` (Nginx, port 3000).
- In local dev mode, only `db` runs in Docker; backend and frontend run as native processes.
- Frontend is built with Vite and served via Nginx in production. `nginx.conf.template` is rendered at container startup via `entrypoint.sh` to inject runtime env vars.

## Environment

Required `.env` at repo root (used by both Docker Compose and local dev):

```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT
ALLOWED_ORIGINS   # JSON array of allowed CORS origins
SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
VITE_CASHIO_API_BASE_URL  # e.g. http://localhost:8000
```

Set `POSTGRES_HOST=db` for Docker, `localhost` for local dev.
