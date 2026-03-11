# Stage 1: Build the application
FROM python:3.12-slim AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Copy the application code
COPY . .

# Stage 2: Create the final image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install postgresql-client-18 from official PostgreSQL repo (modern, no apt-key)
RUN apt-get update \
  && apt-get install -y wget gnupg2 lsb-release \
  && mkdir -p /etc/apt/keyrings \
  && wget --quiet -O /etc/apt/keyrings/pg-archive-keyring.gpg https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  && echo "deb [signed-by=/etc/apt/keyrings/pg-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && apt-get update \
  && apt-get install -y postgresql-client-18 \
  && rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from the builder stage
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

# Ensure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Set the working directory
WORKDIR /app

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["python", "-m", "app.main"]
