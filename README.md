# Cashio

A personal finance web application for tracking incomes, expenses and managing accounts.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [SSL Setup](#ssl-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Using the Cashio-Stack Helper Script](#using-the-cashio-stack-helper-script)

## Project Overview

Cashio is composed of two main components:

- **cashio-api**: Backend service built with Python FastAPI
- **cashio-ui**: Frontend application built with React, Chakra-UI, and TanStack Query

Both components are included as submodules in this repository.

## Prerequisites

Before you begin, ensure you have the following installed:

- Git
- Docker and Docker Compose
- OpenSSL (for certificate generation)

## Getting Started

1. Clone the repository with submodules:

   ```bash
   git clone --recurse-submodules https://github.com/justmeandopensource/cashio.git
   cd cashio
   ```

2. Create a directory for SSL certificates:
   ```bash
   mkdir -p certs
   ```

### SSL Setup

Set up a custom root Certificate Authority (CA) and generate server certificates for secure HTTPS connections to Cashio web application.

#### Step 1: Generate Root CA Certificate

First, we'll create a private key and self-signed certificate for the cashio root Certificate Authority (CA):

```bash
# Generate a private key for your CA
openssl genpkey -algorithm RSA -out certs/ca-key.pem

# Create a self-signed CA certificate (valid for 10 years)
openssl req -x509 -new -key certs/ca-key.pem -days 3650 -out certs/ca-cert.pem -subj "/CN=Cashio CA"
```

This creates two files:

- `certs/ca-key.pem`: Root CA's private key (keep this secure!)
- `certs/ca-cert.pem`: Root CA's public certificate (will be used to sign server certificates)

#### Step 2: Generate Server Certificate

Now, create a certificate for server that will be signed by root CA:

```bash
# Generate a private key for the server
openssl genpkey -algorithm RSA -out certs/key.pem

# Create a configuration file for certificate with SAN extension
cat > certs/server.cnf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = \${DOMAIN}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = \${DOMAIN}
EOF

# Replace ${DOMAIN} placeholder with your actual domain
sed -i "s/\${DOMAIN}/${DOMAIN}/g" certs/server.cnf
# Replace ${DOMAIN} with the value you set for DOMAIN in your .env file, e.g., "cashio.local"

# Create a certificate signing request (CSR)
openssl req -new -key certs/key.pem -out certs/server.csr -config certs/server.cnf
# Replace ${DOMAIN} with the value you set for DOMAIN in your .env file, e.g., "cashio.local"

# Sign the CSR with the CA certificate (valid for 1 year)
openssl x509 -req -in certs/server.csr -CA certs/ca-cert.pem -CAkey certs/ca-key.pem -CAcreateserial -out certs/cert.pem -days 365 -extensions v3_req -extfile certs/server.cnf
```

Note: Make sure the domain name in your certificate matches the DOMAIN value you set in your .env file.

The process creates these files:

- `certs/key.pem`: Server's private key
- `certs/server.csr`: Certificate signing request (temporary file)
- `certs/cert.pem`: Signed server certificate
- `certs/ca-cert.srl`: Serial number file (can be safely ignored)

#### Step 3: Trust the CA Certificate in Browsers

Browsers won't trust this server certificate signed by custom CA. You'll need to add the CA certificate `certs/ca-cert.pem` to your browser's trusted certificate store.

## Environment Configuration

Cashio requires environment variables to be configured before running the application.

### Backend Configuration

1. Copy the template environment file to create your own:

   ```bash
   cp dotenv-template .env
   ```

2. Edit the `.env` file and update the values as needed.
   Note: The DOMAIN variable is used by docker-compose to configure the frontend and should match the domain name you used when generating SSL certificates.

### Frontend Configuration

1. Copy the frontend template environment file:

   ```bash
   cp cashio-ui/dotenv-template cashio-ui/.env
   ```

2. Edit the `cashio-ui/.env` file and update the values as needed.

## Running the Application

After completing the setup steps above, you can run the application using Docker Compose:

```bash
docker-compose up -d
```

This will start all required services:

- PostgreSQL database (cashio-db)
- FastAPI backend (cashio-api)
- React frontend with Nginx (cashio-ui)

You can access the application by navigating to `https://${DOMAIN}` in your browser, where ${DOMAIN} is the value you configured in your .env file. Make sure your `/etc/hosts` file includes an entry for your domain (e.g., `cashio.local`) pointing to `127.0.0.1`.

Example hosts file entry:

```
127.0.0.1   cashio.local
```

To stop the application:

```bash
docker-compose down
```

## Using the Cashio-Stack Helper Script

The `cashio-stack` script provides a simplified interface for managing the Cashio application. It wraps Docker Compose commands with easy-to-use shortcuts for common operations.

### Setup

1. Make sure the script is executable:

   ```bash
   chmod +x cashio-stack
   ```

2. For convenience, you may want to add the script to your PATH or create a symbolic link to it in a directory that's already in your PATH.

### Configuration

Before using the script, you may need to modify the `CASHIO_DIR` variable at the top of the script to point to your Cashio repository location:

```bash
# Change below path to wherever you have checkout the cashio repo
CASHIO_DIR="$HOME/cashio"
```

### Available Commands

The script provides the following commands:

#### Service Management

- **Start services**:

  ```bash
  ./cashio-stack start [service]
  ```

  Starts all services or a specific service (cashio-api, cashio-ui, or cashio-db).

- **Stop services**:

  ```bash
  ./cashio-stack stop [service]
  ```

  Stops all services or a specific service.

- **Restart services**:

  ```bash
  ./cashio-stack restart [service]
  ```

  Restarts all services or a specific service.

- **Remove services**:

  ```bash
  ./cashio-stack down [service]
  ```

  Stops and removes all services or a specific service.

- **Build services**:
  ```bash
  ./cashio-stack build [service]
  ```
  Builds all services or a specific service.

#### Database Operations

- **Backup database**:

  ```bash
  ./cashio-stack backup
  ```

  Creates a backup of the PostgreSQL database in the `$CASHIO_DIR/backup` directory.

- **Restore database**:
  ```bash
  ./cashio-stack restore
  ```
  Resets the database and restores it from the latest backup.

#### Status and Help

- **Show status**:

  ```bash
  ./cashio-stack status
  ```

  Displays the current status of all services.

- **Show help**:
  ```bash
  ./cashio-stack help
  ```
  Displays help information with a list of available commands.

### Examples

Start the entire application:

```bash
./cashio-stack start
```

Restart only the API service:

```bash
./cashio-stack restart cashio-api
```

Build the UI service:

```bash
./cashio-stack build cashio-ui
```

Backup the database before making changes:

```bash
./cashio-stack backup
```

Check the status of all services:

```bash
./cashio-stack status
```

The helper script makes it easier to manage the Cashio application without having to remember complex Docker Compose commands and options.
