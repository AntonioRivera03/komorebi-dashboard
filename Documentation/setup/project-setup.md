# Local project setup

The repository contains two application projects and one documentation area:

- `Web/` — React, TypeScript and Vite.
- `Server/` — Python, FastAPI, Pydantic and Uvicorn, managed with uv.
- `Documentation/` — product specification, proposal and earlier design studies.

## Frontend

```bash
cd Web
npm install
npm run dev
```

Run `npm run build` for a production frontend build and `npm run lint` for the configured Oxlint checks.

## Server

The backend core now includes PostgreSQL migrations, revocable sessions, explicit module composition, transactional idempotency/outbox, a durable worker, private files and secrets, AI policy ports, notifications, and initial Tasks/Usage/Conversations services.

```bash
cd Server
uv sync
uv run komorebi-admin init
docker compose up -d postgres
uv run alembic upgrade head
uv run komorebi-server
```

Run `uv run komorebi-worker` in a second terminal. An existing PostgreSQL installation can replace Docker by setting the database URL in `.env`.

See [the backend guide](../../Server/README.md) for sign-in tickets, API conventions, generated TypeScript types, tests, deployment boundaries and recovery. The frontend still uses mocks; its existing role switch does not authenticate backend requests.
