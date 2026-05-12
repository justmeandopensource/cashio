{
  description = "Cashio — personal finance management — dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        python = pkgs.python312;
        pythonEnv = python.withPackages (ps: with ps; [
          pip
          virtualenv
        ]);
      in {
        devShells.default = pkgs.mkShell {
          name = "cashio-dev";

          packages = with pkgs; [
            pythonEnv
            nodejs_22
            nodePackages.npm
            postgresql_16
            stdenv.cc.cc.lib
            lsof
          ];

          shellHook = ''
            # Point Docker compat tools at the rootless podman socket
            export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"
            # Suppress podman-compose warning
            export PODMAN_COMPOSE_WARNING_LOGS=false
            # Make libstdc++.so.6 available for pandas and other C extensions
            export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH"

            # Ensure podman socket is running
            systemctl --user enable --now podman.socket 2>/dev/null || true

            # Create .env from template if missing
            if [ ! -f .env ]; then
              echo "[cashio] No .env found. Creating template..."
              echo "DOMAIN=cashio.test" > .env
              echo "POSTGRES_USER=admin" >> .env
              echo "POSTGRES_PASSWORD=change-me" >> .env
              echo "POSTGRES_DB=cashio" >> .env
              echo "POSTGRES_HOST=localhost" >> .env
              echo "POSTGRES_PORT=5432" >> .env
              echo 'ALLOWED_ORIGINS=["http://cashio.test"]' >> .env
              echo "SECRET_KEY=replace-with-a-long-random-string" >> .env
              echo "ALGORITHM=HS256" >> .env
              echo "ACCESS_TOKEN_EXPIRE_MINUTES=300" >> .env
              echo "VITE_CASHIO_API_BASE_URL=http://cashio.test:8000" >> .env
              echo "[cashio] Created .env - edit SECRET_KEY and passwords before starting"
            fi

            # Set up Python virtual environment if missing
            if [ ! -f backend/.venv/bin/python ]; then
              echo "[cashio] Creating Python virtual environment..."
              rm -rf backend/.venv
              python3 -m venv backend/.venv
            fi
            if [ ! -d backend/.venv/lib/python3.12/site-packages/fastapi ]; then
              echo "[cashio] Installing Python dependencies..."
              backend/.venv/bin/pip install -r backend/requirements.txt
            fi

            # Install frontend dependencies if missing
            if [ ! -d frontend/node_modules ]; then
              echo "[cashio] Installing frontend npm dependencies..."
              cd frontend && npm install && cd ..
            fi

            echo "[cashio] Dev environment ready."
            echo "  Backend:  ./cashio-stack start-local-backend"
            echo "  Frontend: ./cashio-stack start-local-frontend"
            echo "  Both:     ./cashio-stack start-local"
          '';
        };
      });
}
