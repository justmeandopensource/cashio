# Gemini Project Context: cashio

This document provides a foundational context for AI models interacting with the `cashio` project. Its purpose is to ensure that AI-generated code, analysis, and modifications align with the project's established standards and architecture.

## Project Overview

The `cashio` repository is the main repository for the Cashio personal finance application. It orchestrates the deployment of the backend API (`cashio-api`) and the frontend user interface (`cashio-ui`) using Docker Compose. The `cashio-api` and `cashio-ui` repositories are included as Git submodules.

The primary purpose of this repository is to provide a single place to manage and deploy the entire Cashio application.

## Project Structure

```
cashio/
├── cashio-api/         # Git submodule for the backend API
├── cashio-ui/          # Git submodule for the frontend UI
├── docker-compose.yaml # Docker Compose file for orchestration
├── .gitmodules         # Git submodule configuration
├── README.md           # Project documentation
└── ...
```

*   **`cashio-api/`**: A Git submodule that points to the `cashio-api` repository. This contains the source code for the backend API.
*   **`cashio-ui/`**: A Git submodule that points to the `cashio-ui` repository. This contains the source code for the frontend application.
*   **`docker-compose.yaml`**: The core of this repository. It defines the services for the database, backend, and frontend, and how they are networked together.
*   **`.gitmodules`**: Defines the Git submodules used in the project.

## Development Workflow

### Setup

1.  Clone the repository with its submodules:
    ```bash
    git clone --recurse-submodules https://github.com/justmeandopensource/cashio.git
    cd cashio
    ```
2.  Follow the instructions in the `README.md` to set up SSL certificates and configure the environment variables in the `.env` files.

### Running the Application

The entire application stack is managed by Docker Compose.

*   To start the application:
    ```bash
    docker-compose up -d
    ```
*   To stop the application:
    ```bash
    docker-compose down
    ```

A helper script `cashio-stack` is also provided for easier management of the application stack.

## Submodule Management

The `cashio-api` and `cashio-ui` repositories are managed as Git submodules. This means that development should happen in the respective mono-repositories. When changes are ready to be integrated, the submodules in this `cashio` repository should be updated to point to the latest commits.

To update the submodules to the latest commit on their respective main branches:

```bash
git submodule update --remote --merge
```

After updating the submodules, commit the changes to this repository to lock in the new versions of the submodules.

## Deployment

The application is deployed using Docker Compose. The `docker-compose.yaml` file defines three services:

*   **`cashio-db`**: A PostgreSQL database container.
*   **`cashio-api`**: The backend API container, built from the `cashio-api` submodule.
*   **`cashio-ui`**: The frontend container, which uses Nginx to serve the static files built from the `cashio-ui` submodule.

The `README.md` file provides detailed instructions for deployment.

## Important Notes for AI Assistants

*   This repository is for orchestration and deployment, not for application development. All code changes for the API and UI should be made in their respective repositories (`cashio-api` and `cashio-ui`).
*   When asked to make changes to the API or UI, you should navigate to the respective submodule directory and perform the changes there.
*   Always be aware of the submodule nature of this project. When cloning or pulling changes, ensure that the submodules are also updated correctly.
*   Refer to the `GEMINI.md` files in the `cashio-api` and `cashio-ui` submodules for detailed information about their respective architectures and development workflows.
