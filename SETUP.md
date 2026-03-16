# Cashio Setup Guide

A step-by-step guide to get Cashio running on your Mac from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone the Repository](#clone-the-repository)
3. [Configure a Local Hostname](#configure-a-local-hostname)
4. [Set Up HTTPS Certificates](#set-up-https-certificates)
5. [Create the Environment File](#create-the-environment-file)
6. [Run Cashio](#run-cashio)
7. [Trust the Certificate on Other Devices](#trust-the-certificate-on-other-devices)
8. [Certificate Renewal](#certificate-renewal)
9. [Command Reference](#command-reference)

---

## Prerequisites

Install the following before you begin.

| Tool                                                              | Purpose                                                | Install                  |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs the database (and all services in container mode) | Download from docker.com |
| [mkcert](https://github.com/FiloSottile/mkcert)                   | Generates locally-trusted HTTPS certificates           | `brew install mkcert`    |
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

## Set Up HTTPS Certificates

Cashio uses [mkcert](https://github.com/FiloSottile/mkcert) to issue certificates signed by a locally-trusted CA. This gives you a green padlock in the browser with no warnings.

### Step 1 — Install the local CA

This only needs to be done once per machine. It installs a root CA into your Mac Keychain.

```bash
mkcert -install
```

You will be prompted for your Mac password. After this, any certificate signed by mkcert will be trusted by Safari and Chrome on your Mac.

### Step 2 — Generate the certificate

Run this from the root of the cashio repository:

```bash
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem cashio.test
```

The `certs/` directory is gitignored and will never be committed to the repository.

> **Tip:** If you plan to access Cashio from a custom hostname (e.g. a NoIP domain like `cashio.hopto.org`) add it to the same command:
>
> ```bash
> mkcert -cert-file certs/cert.pem -key-file certs/key.pem cashio.test cashio.hopto.org
> ```

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
ALLOWED_ORIGINS=["https://cashio.test"]

# JWT — generate a secure key with: openssl rand -hex 32
SECRET_KEY=replace-with-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=300

# API base URL baked into the frontend at build time
VITE_CASHIO_API_BASE_URL=https://cashio.test:8000
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
open https://cashio.test
```

### Option B — Local dev mode (recommended for development)

Only the database runs in Docker. The backend (FastAPI + uvicorn) and frontend (Vite) run as native processes with hot-reload enabled.

**One-time system setup** — allows Node.js to bind to port 443 without sudo:

```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

Then start everything:

```bash
./cashio-stack start-local
```

Open `https://cashio.test` in your browser. Both backend and frontend support hot-reload — changes are reflected immediately without restarting.

---

## Trust the Certificate on Other Devices

To access Cashio from your iPhone or iPad on the same network, you need to install and trust the mkcert root CA on that device.

### Export the CA certificate

```bash
cat "$(mkcert -CAROOT)/rootCA.pem" > rootCA.pem
```

### Install on iPhone / iPad

1. AirDrop `rootCA.pem` to your iPhone
2. Tap the file when it arrives — iOS will prompt you to install a profile
3. Go to **Settings → General → VPN & Device Management** and install the profile
4. Go to **Settings → General → About → Certificate Trust Settings** and enable full trust for the mkcert CA

After this, `https://cashio.test` will load with a green padlock on your iPhone as well (as long as it is on the same network as your Mac and `cashio.test` resolves — you may need to add a hosts entry via a DNS app, or access via IP).

---

## Certificate Renewal

### Cashio certificate (`certs/cert.pem`)

mkcert certificates are valid for **~2 years** (825 days). When your cert is close to expiring, regenerate it:

```bash
mkcert -cert-file certs/cert.pem -key-file certs/key.pem cashio.test
```

If you added extra hostnames when you first generated it, include them again:

```bash
mkcert -cert-file certs/cert.pem -key-file certs/key.pem cashio.test cashio.hopto.org
```

Then restart Cashio to pick up the new cert:

```bash
# Container mode
./cashio-stack restart all

# Local dev mode — just stop and start again
./cashio-stack start-local
```

You do **not** need to re-install the CA on client devices — only the leaf cert changed.

### mkcert root CA

The local CA is valid for **10 years**. If it ever expires or you need to rotate it:

```bash
# Remove the old CA from your keychain and generate a new one
mkcert -uninstall
mkcert -install

# Re-issue the Cashio certificate under the new CA
mkcert -cert-file certs/cert.pem -key-file certs/key.pem cashio.test
```

After rotating the CA, you must reinstall the new `rootCA.pem` on every device that accesses Cashio (repeat the [Trust the Certificate](#trust-the-certificate-on-other-devices) steps).

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
