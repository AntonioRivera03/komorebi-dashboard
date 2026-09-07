# Komorebi dashboard

## Run the whole app with Docker

From the repository root, with Docker Engine and Docker Compose installed and running:

```bash
docker compose up --build -d
```

Open **http://localhost:8080**. This builds the frontend and backend, starts PostgreSQL and the worker, generates private session/encryption keys on first launch, and applies database migrations before starting the API. No local Node, Python, or `.env` setup is required.

To use a different port: `KOMOREBI_PORT=8090 docker compose up --build -d`.

### Connect Learn to the server

The dashboard opens with browser preview data. Learn supports server persistence; other frontend capabilities currently use mock adapters. Generate a one-use sign-in ticket:

```bash
docker compose exec api komorebi-admin login --name 'Owner'
```

Open **Learn → Connect learning** and paste the ticket (valid for ten minutes). Use **Storage & account → Import this browser’s learning** to copy preview data into an empty server workspace.

### Import PDFs

In a Learn session, use **Add a source → File → Process file**. Files can be up to **5 MB**; PDFs can contain up to **100 unencrypted pages**. Scanned pages use local English OCR. The dialog shows processing status and lets you cancel; review the extracted text before adding the source. Both the API and worker must be running. The older Library import screen still uses mock data.

After updating this branch, `docker compose up --build -d` rebuilds the OCR dependencies and applies the new import-table migration. The existing 200,000-character source limit and 800 KB workspace limit still apply.

### Manage the app

```bash
docker compose logs -f       # View logs
docker compose ps           # Check services
docker compose down         # Stop; keep data
docker compose up --build -d # Start again or rebuild after code changes
```

Database records live in the `postgres-data` named volume. Uploaded files and generated keys live in `app-data`. Preserve both volumes when backing up or moving the installation. `docker compose down --volumes` permanently deletes both, including the keys. This stack uses separate data from the database-only `Server/compose.yaml` setup.

The app is bound to this computer's loopback interface. This is a local setup with development database credentials and HTTP cookies; configure TLS, credentials, hosts, and secure cookies before deploying publicly. External AI jobs remain disabled by default.

If Docker reports permission denied for `/var/run/docker.sock`, run the command with `sudo` or configure your user's Docker access. If the daemon is unavailable, start Docker first.

See [Server/README.md](Server/README.md) for API details and running the backend without containers.
