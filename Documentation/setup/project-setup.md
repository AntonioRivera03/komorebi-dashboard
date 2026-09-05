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

```bash
cd Server
uv sync
uv run komorebi-server
```

The development API listens on `http://127.0.0.1:8000`. Its initial setup endpoint is `GET /health`; interactive FastAPI documentation is available at `/docs` while the server is running.

Run `uv run ruff check .` for Python lint checks. Capability packages, databases, integrations and generated frontend API clients are intentionally deferred to their implementation slices.
