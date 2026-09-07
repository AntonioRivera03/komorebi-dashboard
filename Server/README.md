# Komorebi backend core

A capability-oriented FastAPI monolith. The API and worker share one release and PostgreSQL database; each capability owns its schema and application operations. Learn has an optional real server connection; other frontend capabilities still use mock adapters. Generated browser types are available in `Web/src/generated/api.d.ts`.

## Run locally

From `Server/`:

```bash
uv sync
uv run komorebi-admin init
# Starts only the local development database; requires Docker access.
docker compose up -d postgres
uv run alembic upgrade head
uv run komorebi-server
```

In a second terminal:

```bash
cd Server
uv run komorebi-worker
```

`init` generates `.env` with a random session signing key and Fernet encryption key, mode `0600`. It refuses to overwrite an existing file. Configure your existing PostgreSQL connection instead of Docker if preferred. Development database credentials in `compose.yaml` are loopback-only examples.

- API: `http://127.0.0.1:8000`
- OpenAPI/interactive API: `/openapi.json` and `/docs` in development
- Process liveness: `/health`
- Database migration readiness and worker heartbeat: `/health/ready`

### Sign in

```bash
uv run komorebi-admin login --name 'Owner'
```

This prints a cryptographically random, single-use ticket valid for ten minutes. Submit it as `{"ticket":"..."}` to `POST /api/v1/core/session`. Retain the returned HttpOnly session cookie and send the returned `csrfToken` as `X-CSRF-Token` on subsequent mutations. This operator-mediated pairing is the initial local identity flow; no password implementation or public registration endpoint exists.

The response includes `actorId`, `sessionId`, `principal`, `scopes`, and expiry. `GET /api/v1/core/session` restores browser session state after reload. Logout and device revocation invalidate sessions server-side. An owner can issue a restricted display ticket through `/api/v1/core/pairings`. Display sessions cannot read Tasks, conversations, files, settings, job payloads, or Usage history. Their initial granted scopes are reserved for future display-safe APIs.

The frontend's mock role switch is **not** authentication. Use these session endpoints when replacing frontend mocks.

### First persisted command

After signing in through an HTTP client that retains cookies:

```http
POST /api/v1/tasks
Content-Type: application/json
X-CSRF-Token: <session csrfToken>
Idempotency-Key: <unique command key>

{"title":"Verify the backend core","estimateMinutes":20}
```

The response is `{"status":"completed","value":{...}}`. Repeating a key with identical input returns the original result; different input returns `409`. Updates use `PUT /api/v1/tasks/{id}` and a complete task draft. Completion/reopening/cancellation use `POST /api/v1/tasks/{id}/{complete|reopen|cancel}`. Every change requires `If-Match: <revision>` and an idempotency key. Lists return bounded snapshots with `nextCursor`; pass it as `cursor` to continue. UUID ordering supplies a deterministic pagination order, not chronological sorting.

Tasks includes create/read/edit, completion/reopen/cancel, history, ownership, and optimistic concurrency. Recurrence, task deletion and capture conversion belong to subsequent capability slices.

## Core responsibilities implemented

- **Composition:** explicit manifests, provided/required/optional ports, namespace checks, dependency ordering, cycle detection, permissions, routes, job handlers, subscriptions and module export callbacks. No service-name lookups inside business operations.
- **Identity:** Starlette-signed opaque session IDs backed by revocable PostgreSQL sessions, one-use owner/display tickets, expiry, HttpOnly/SameSite cookies, CSRF and origin checks. Secure cookies default on; loopback development explicitly opts out.
- **Configuration:** validated environment settings and revision-controlled per-owner timezone, locale, theme, quiet hours and audio-retention preferences. Module configuration is deployment-time, not a live toggle API.
- **Persistence:** SQLAlchemy 2, schema-qualified tables, frozen Alembic migrations, UTC instants, bounded queries, transaction-scoped audit/outbox/idempotency. PostgreSQL is required at runtime; SQLite is a test adapter.
- **Execution:** atomic outbox dispatch, deduplicated event receipts with local effects in the same transaction, PostgreSQL `SKIP LOCKED` claims, fenced leases, capped retry backoff, failed jobs, safe local retries and worker heartbeat.
- **Files/secrets:** bounded private immutable uploads, opaque file IDs, owner checks, forced-download responses, deletion tombstones, encrypted credential storage through an internal adapter port. No public plaintext credential endpoint or arbitrary URL fetching.
- **AI:** injected provider protocol, disclosure gate, scope checks, atomic monthly budget reservations, run identity, sanitized usage/outcome metadata and cancellation port. Budget units are token units, not estimated cents. Unknown failures retain reservations rather than claiming zero cost.
- **Notifications:** durable deduplicated inbox and read acknowledgement. Quiet hours are stored preferences for future external channel adapters; they do not hide inbox records.
- **Operations:** stable error envelopes, request correlation IDs, body limits including chunked requests, health/readiness, job inspection, and private ZIP export of all installed modules plus original files. Credentials, login tickets and session secrets are excluded.

`conversations` persists threads and ordered messages and queues bounded AI reply jobs. The worker rechecks authorization and input revisions before execution and before saving a reply. `usage` consumes task/conversation facts through the outbox, retaining minimal immutable observations without copying content. These remain capability-owned tables; Core does not store business history in a universal record model.

## AI and external effects

No live provider is selected or invoked by default. Inject an adapter implementing `core.ai.AIProvider` at composition time, declare its data policy, and explicitly enable `KOMOREBI_AI_DISCLOSURE_ALLOWED` and `KOMOREBI_EXTERNAL_JOBS_ENABLED`. The adapter must honor timeout/output limits, never execute application tools, and report usage within the reservation contract. Tests use a deterministic adapter.

External jobs are queued but unclaimed when execution is disabled. Missing provider setup produces a visible failure when an operator enables execution. A provider failure retains the original user message. Interrupted external jobs become `unknown_outcome`; the generic retry endpoint rejects them. Reconcile the provider's outcome before implementing provider-specific retries. AI reservations for interrupted/canceled runs currently require operator reconciliation; there is no automatic refund or external replay.

Local event consumers can be retried at least once. Their receipt and effects commit together. Application job handlers own short transactions and must be idempotent; no database transaction is held during provider I/O. The default lease is 120 seconds and the AI adapter timeout contract is 60 seconds. Long-running future handlers need explicit lease renewal rather than assuming this lease is unlimited.

## Module lifecycle and extension

`KOMOREBI_ENABLED_MODULES` controls startup composition. Unknown modules, duplicate registrations, missing required ports and dependency cycles fail startup. Disabled routes are absent and workers do not claim that module's jobs; data is retained. In-flight processes must be stopped/restarted together when changing this setting. Re-enabling retains queued work, but events emitted while a consumer was disabled need a consumer-owned rebuild/backfill; dynamic lifecycle orchestration is not implemented.

To add a capability:

1. Implement its owned domain/service/repositories and Pydantic boundary models.
2. Add schema-owned migrations and an entry to `alembic.ini`'s version locations. Migrations are ordered for deployment; that order is not a business dependency.
3. Expose a `create_module(platform, explicit_dependencies...)` bootstrap and manifest.
4. Wire it in `app/composition.py`; consumers receive public ports, never private repositories.
5. Add contract, rollback, permission, concurrency and recovery tests. Extend architecture rules for new contract namespaces.
6. Regenerate contracts with `./scripts/generate_contracts.sh` and integrate the owning frontend API adapter.

Shared contracts cannot import database clients or Core/capability implementations. Core cannot import capabilities. Capabilities cannot import each other's implementations or Core's private ORM models. Tests enforce these boundaries. The platform transaction factory and persistence helpers are explicit public infrastructure ports.

## Verify

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest -q
# Includes isolated real PostgreSQL, migrations and concurrent writers/workers:
uv run --with pgserver pytest -q
./scripts/generate_contracts.sh
cd ../Web
npm run build
```

`pgserver` is an optional test runner dependency; it downloads PostgreSQL binaries and starts disposable clusters in pytest's temporary directory without Docker or privileged access. Ordinary `pytest` skips those PostgreSQL-specific tests. No test contacts an AI provider or changes a real device.

## Deployment and recovery

This is a backend foundation, not a production deployment bundle. Before exposure, configure TLS and explicit origins/hosts, turn secure cookies on, and use a long random signing key. Run migrations with separate DDL credentials (`KOMOREBI_MIGRATION_DATABASE_URL`). Give the runtime role only schema usage and table SELECT/INSERT/UPDATE/DELETE, plus SELECT on `public.alembic_version`; do not grant schema creation. Apply default privileges for future tables under the migration owner.

`uv run komorebi-admin export private-export.zip` writes a new mode-0600 archive and refuses to overwrite an existing file. It includes data from installed modules even if disabled. Treat it as a portable export, not a transactionally consistent database backup: pause writers if a consistent export is required.

For disaster recovery, back up PostgreSQL with `pg_dump` and the private file volume together during a maintenance window. Keep the encryption/signing keys separately from database/file backups. Restore into an isolated installation, run migrations, verify file hashes against metadata, and keep external jobs disabled until provider state is reconciled. Automated retention, scheduled backups, a full restore verifier, account/capability deletion workflows, browser event streaming, and provider-specific reconciliation are subsequent operational slices.


## Run only Learn

After the local setup and migrations above:

```bash
# From Server/, enable only Learn for this process.
KOMOREBI_ENABLED_MODULES='["learn"]' uv run komorebi-server
# In Web/ (Vite proxies /api to 127.0.0.1:8000):
npm run dev
# From Server/, issue a one-use ticket:
uv run komorebi-admin login --name 'Owner'
```

Open `/learn`, choose **Connect learning**, and enter the ticket. An existing server session can also be restored. The server workspace starts empty; **Storage & account → Import this browser’s learning** explicitly copies preview data into an empty workspace. Existing installations with an explicit enabled-module list must add `learn` or use the command above. Migrations still install the complete release schema; disabled capabilities expose no routes. The manual Learn workflows need no worker or AI provider; Core readiness will report a stale worker until one is running.

`GET /api/v1/learn/workspace` returns the typed workspace and revision. `PUT` requires CSRF, `Idempotency-Key`, and `If-Match` (zero for the initial save). Writes validate source offsets, relationships and an 800 KB serialized workspace limit. There is one revision per owner workspace, so simultaneous edits conflict visibly. Keep the tab open until saved; export unsaved edits before choosing to reload a conflicting server copy. Sign-in recovery with a new same-owner ticket preserves pending edits and retry keys.

`DELETE /api/v1/learn/workspace` is a separate explicit revision-checked deletion command. Core ZIP export includes the workspace, including when Learn is disabled. Local preview data and the device's timer settings are separate browser data. Source imports support websites, UTF-8 text/Markdown/HTML, and text-based PDFs. Website, HTML and PDF processing requires an active owner session; plain text/Markdown can be read locally. AI generation and automatic quiz grading remain disabled. See [the decision](../Documentation/decisions/002-learning-workspace.md) for the bounded aggregate's tradeoffs.

Verify Learn with `npm run test:learn` in Web and `uv run --with pgserver pytest -q` in Server.


### Source processing

`POST /api/v1/learn/sources/website` takes `{"url":"https://…"}` and returns normalized `title`, `content` and final `url`. `POST /api/v1/learn/sources/file` accepts a multipart `file` and returns extracted text. Both require the owner session and CSRF. These endpoints prepare a source without saving it; the user reviews the text and adds it through the normal workspace save.

Website fetching pins public DNS addresses and rechecks redirects, verifies HTTPS certificates, and caps concurrency, time and response size. File parsing uses a disposable process with CPU/memory/time bounds. Files are limited to 2 MB, PDFs to 100 pages and sources to 200,000 characters. Scanned/encrypted PDFs, blocked or JavaScript-only webpages and extraction failures offer a paste fallback. Original files are not retained yet. See [source reader/import decisions](../Documentation/decisions/003-source-reader-and-imports.md).

### PDF extraction and OCR

Learn file imports accept up to **5 MB (5,000,000 bytes)**. PDFs run in the worker and use local OCRmyPDF/Tesseract for scanned pages; selectable text is preserved. Docker includes the English language data and Ghostscript. For a local Python setup, install `tesseract` with English data and `ghostscript` through your system package manager, run `uv sync`, apply `alembic upgrade head`, and run both the API and `uv run komorebi-worker`.

`POST /api/v1/learn/sources/file` requires a multipart `file`, an `Idempotency-Key`, and an authenticated owner session with CSRF. PDFs return **202** with an import ID; poll `GET /api/v1/learn/sources/imports/{id}` and use `DELETE` on the same URL to cancel/discard. HTML and text return extracted contents directly. Extraction never saves a source to the workspace automatically.

Limits: unencrypted PDFs, 100 pages, five minutes of processing, 200,000 extracted characters per source, and the existing 800 KB workspace cap. PDF imports are retained for at most one hour while the worker is running; raw bytes are cleared on completion and all temporary import data is discarded when the browser receives the result or cancels. Worker maintenance clears abandoned imports. Website downloads remain limited to 2 MB. The older Library import UI remains a mock; use Learn session **Add a source**.
