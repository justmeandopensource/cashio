# Cashio Setup Guide

A step-by-step guide to get Cashio running on your Mac from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone the Repository](#clone-the-repository)
3. [Configure a Local Hostname](#configure-a-local-hostname)
4. [Create the Environment File](#create-the-environment-file)
5. [Run Cashio](#run-cashio)
6. [Command Reference](#command-reference)

---

## Prerequisites

Install the following before you begin.

| Tool                                                              | Purpose                                                | Install                  |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs the database (and all services in container mode) | Download from docker.com |
| [Node.js](https://nodejs.org/) (v18+)                             | Required for local frontend dev mode                   | `brew install node`      |
| [Python](https://www.python.org/) (3.11+)                         | Required for local backend dev mode                    | `brew install python`    |

Node.js and Python are only needed if you plan to use `start-local` mode. Container mode only requires Docker.

---

## Clone the Repository

```bash
git clone <repo-url> cashio
cd cashio
```

---

## Configure a Local Hostname

Cashio uses `cashio.test` as its local domain. Add it to your Mac's hosts file so your browser can resolve it.

```bash
sudo nano /etc/hosts
```

Add this line at the bottom:

```
127.0.0.1   cashio.test
```

Save with `Ctrl+O`, then `Ctrl+X`. Verify with:

```bash
ping -c 1 cashio.test
```

---

## Create the Environment File

Create a `.env` file at the root of the repository. This file is gitignored and must be created manually on each machine.

```bash
cp /dev/null .env   # creates an empty file
nano .env
```

Paste and customise the following:

```dotenv
# Hostname used by the frontend container and nginx
DOMAIN=cashio.test

# PostgreSQL — used by the database container and backend
# POSTGRES_HOST must be "localhost" for local dev mode
# (Docker Compose overrides this to "db" automatically for container mode)
POSTGRES_USER=admin
POSTGRES_PASSWORD=change-me
POSTGRES_DB=cashio
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# CORS — origins the backend will accept requests from
ALLOWED_ORIGINS=["http://cashio.test"]

# JWT — generate a secure key with: openssl rand -hex 32
SECRET_KEY=replace-with-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=300

# API base URL baked into the frontend at build time
VITE_CASHIO_API_BASE_URL=http://cashio.test:8000
```

**Generating a secure SECRET_KEY:**

```bash
openssl rand -hex 32
```

Copy the output and replace `replace-with-a-long-random-string` in `.env`.

---

## Run Cashio

There are two ways to run Cashio. Choose the one that fits your workflow.

### Option A — Container mode (recommended for most users)

All three services (database, backend, frontend) run in Docker containers. Hot-reload is not available.

```bash
# First time (or after code changes)
./cashio-stack build all
./cashio-stack start all

# Open in browser
open http://cashio.test:3000
```

### Option B — Local dev mode (recommended for development)

Only the database runs in Docker. The backend (FastAPI + uvicorn) and frontend (Vite) run as native processes with hot-reload enabled.

Then start everything:

```bash
./cashio-stack start-local
```

Open `http://cashio.test:3000` in your browser. Both backend and frontend support hot-reload — changes are reflected immediately without restarting.

---

## Command Reference

### Service management

| Command                         | What it does                               |
| ------------------------------- | ------------------------------------------ |
| `./cashio-stack build all`      | Build all Docker images                    |
| `./cashio-stack build backend`  | Build only the backend image               |
| `./cashio-stack build frontend` | Build only the frontend image              |
| `./cashio-stack start all`      | Start all containers in the background     |
| `./cashio-stack stop all`       | Stop all containers                        |
| `./cashio-stack restart all`    | Restart all containers                     |
| `./cashio-stack down all`       | Stop and remove all containers             |
| `./cashio-stack status`         | Show container and local dev server status |
| `./cashio-stack logs backend`   | Follow logs for the backend container      |
| `./cashio-stack logs frontend`  | Follow logs for the frontend container     |

### Local dev mode

| Command                               | What it does                                                |
| ------------------------------------- | ----------------------------------------------------------- |
| `./cashio-stack start-local`          | Start backend + frontend locally (database stays in Docker) |
| `./cashio-stack start-local-backend`  | Start only the backend locally                              |
| `./cashio-stack start-local-frontend` | Start only the frontend locally                             |
