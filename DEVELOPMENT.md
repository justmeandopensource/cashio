# Cashio Development Environment Setup

This document describes how to set up and use the development environment for the Cashio project.

## Project Structure

```
~/Dev/repos/jmos/
├── cashio/              # Main repo with submodules and Docker setup
│   ├── cashio-api/      # API submodule
│   ├── cashio-ui/       # UI submodule
│   ├── docker-compose.yaml
│   └── dev-workflow
├── cashio-api/          # API development repo
└── cashio-ui/           # UI development repo
```

## Quick Start

1. **Install Docker Desktop** (if not already installed):

   ```bash
   brew install --cask docker
   ```

2. **Set up the development environment**:

   ```bash
   cd ~/Dev/repos/jmos/cashio
   ./dev-workflow setup-dev    # Sets up .env files, Python venv, and installs dependencies
   ./dev-workflow setup-certs  # Generates SSL certificates
   ```

   ```

   ```

3. **Add to your hosts file** (`/etc/hosts`):

   ```
   127.0.0.1   cashio.local
   ```

4. **Start development servers**:

   ```bash
   ./dev-workflow start-local
   ```

## Development Workflows

### Daily Development Workflow

For day-to-day development, use the local development setup:

```bash
# Start development environment
./dev-workflow start-local

# This starts:
# - Database: Docker container (localhost:5432)
# - API: Local Python server with hot reload (localhost:8000)
# - UI: Local Vite dev server with hot reload (localhost:3000)
```

**Benefits:**

- Fastest startup time
- Hot reloading for both API and UI
- Easy debugging
- Direct access to logs

### Integration Testing Workflow

Before releasing or when testing the full stack:

```bash
# 1. Manually update submodules to desired commits/tags
cd ~/Dev/repos/jmos/cashio
git submodule update --remote  # Get latest from default branch
# OR point to specific commits/tags:
cd cashio-api && git checkout v1.2.3 && cd ..
cd cashio-ui && git checkout v2.1.0 && cd ..

# 2. Test integration with current submodule code
./dev-workflow test-integration

# This will:
# 1. Show current submodule status
# 2. Build Docker containers with submodule code
# 3. Start production-like environment
# 4. Make it available at https://cashio.local

# After testing, cleanup
./dev-workflow cleanup-test
```

### Release Workflow

When ready to create a new release:

```bash
# Run semantic release and update submodules
./dev-workflow release

# This will:
# 1. Run semantic-release for both API and UI
# 2. Create git tags for new versions
# 3. Update submodule references in main repo
# 4. Commit and push changes
```

## Available Commands

```bash
./dev-workflow <command>

Commands:
  setup-dev          Set up development environment (copy .env files)
  setup-certs        Generate SSL certificates for development
  start-local        Start local development servers (API & UI locally, DB in Docker)
  stop-local         Stop local development servers
  test-integration   Test full integration with current development code
  cleanup-test       Clean up after integration test
  release            Run semantic release and update submodules
  status             Show status of services and submodules
  help               Show help message
```

## Environment Configuration

### Development Environment Files

- **`dotenv-template`**: Template for development environment variables
- **`cashio-ui/dotenv-template`**: Template for frontend environment variables

These are automatically copied to their respective `.env` files when running `setup-dev`.

### Automated Dependency Management

The `setup-dev` command automatically handles all dependency installation:

**Python API Dependencies:**

- Creates a virtual environment at `~/Dev/repos/jmos/cashio-api/.venv`
- Installs all Python packages from `requirements.txt`
- Includes FastAPI, uvicorn, SQLAlchemy, and other API dependencies

**Node.js UI Dependencies:**

- Installs all npm packages from `package.json`
- Includes React, Vite, Chakra UI, and other frontend dependencies

**Note:** The `start-local` command automatically activates the Python virtual environment before starting the API server, so you don't need to manually activate it.

## SSL Certificates

Development SSL certificates are automatically generated for `cashio.local`:

```bash
./dev-workflow setup-certs
```

**Important**: Add the generated `certs/ca-cert.pem` to your browser's trusted certificate authorities to avoid SSL warnings.

### Adding to Keychain (macOS)

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/Dev/repos/jmos/cashio/certs/ca-cert.pem
```

## Database Access

The PostgreSQL database runs in Docker and is accessible at:

- **Host**: localhost
- **Port**: 5432
- **Database**: cashio_dev
- **Username**: cashio_dev
- **Password**: password_dev

Connect using your favorite database client or command line:

```bash
psql -h localhost -U cashio_dev -d cashio_dev
```

## Troubleshooting

### Docker Issues

```bash
# Reset Docker state
docker-compose down -v
docker system prune

# Rebuild containers
./dev-workflow stop-dev
./dev-workflow start-dev
```

### Submodule Issues

```bash
# Reset submodules
cd ~/Dev/repos/jmos/cashio
git submodule update --init --recursive
git submodule foreach git reset --hard
```

## Managing Submodules for Integration Testing

The `test-integration` command requires you to manually update submodules before running.

```bash
cd ~/Dev/repos/jmos/cashio

# Point submodules to specific tags
cd cashio-api && git checkout v1.2.3 && cd ..
cd cashio-ui && git checkout v2.1.0 && cd ..

# Verify the status
git submodule status
```

**Important**: Always run `git submodule status` to verify what versions you're testing with.

## Git Workflow

1. **Make changes** in `cashio-api/` or `cashio-ui/` repositories
2. **Test locally** with `./dev-workflow start-local`
3. **Integration test** with `./dev-workflow test-integration`
4. **Release** with `./dev-workflow release` (this updates main repo submodules)
5. **Deploy** the main `cashio` repo to production
