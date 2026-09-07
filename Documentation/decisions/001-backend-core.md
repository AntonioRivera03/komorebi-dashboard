# Backend foundation decisions

Date: 5 September 2026

## Decision

Implement a synchronous SQLAlchemy 2 / FastAPI modular monolith with PostgreSQL-owned `platform`, `tasks`, `usage`, and `conversations` schemas. Use short synchronous database operations in FastAPI's thread pool; the API and worker are separate process roles of the same package. Alembic revisions live with their schema owner, with deployment sequencing declared in one migration configuration.

Exercise Core through a small Tasks service, event-driven Usage observations, and durable Conversations. Do not generate empty capability layers for the remaining frontend screens. The existing frontend remains a mock experience until its adapters and shell session provider are integrated with the generated OpenAPI contracts.

Identity starts with operator-issued one-use tickets, a single owner identity and paired display sessions. Starlette handles signed cookie serialization; cookies carry only an opaque server-side session ID. PostgreSQL holds expiry, revocation and scopes. This avoids choosing an external identity provider or implementing password cryptography. There is no household entity until a capability requires shared ownership.

Use PostgreSQL uniqueness and `INSERT ... ON CONFLICT ... RETURNING` for idempotency arbitration, not driver row-count assumptions. Use transactional outbox receipts for local effects and `FOR UPDATE SKIP LOCKED` plus fencing tokens for worker leases. Local work retries with backoff; uncertain external effects stop for reconciliation. [SQLAlchemy selection and locking](https://docs.sqlalchemy.org/en/20/core/selectable.html), [Starlette session middleware](https://www.starlette.io/middleware/#sessionmiddleware).

AI has an injected provider protocol and explicit disclosure/budget gates; no cloud/local provider has been selected. Budget accounting uses token units until a concrete provider supplies validated pricing. Conversations owns message content; Core stores only execution and usage metadata. Application tools and business prompts are outside the gateway.

## Consequences and limits

- Deployment requires PostgreSQL; SQLite supports fast tests but is not evidence of production concurrency behavior. Disposable PostgreSQL integration tests cover migrations, concurrent commands and workers.
- The composition root owns registration. Static architecture tests enforce import direction, with manifest validation enforcing declared dependency cycles.
- Runtime credentials must be provisioned without DDL privileges. The checked-in Docker configuration is a loopback development database, not production provisioning.
- Module changes are applied at coordinated process restart. Consumer rebuild/backfill is required for missed history after a disabled period; there is no generic runtime enable/disable orchestrator.
- External execution defaults to paused, including after restore. Provider adapters, automatic reconciliation, lease renewal for long jobs, retention, full data-deletion workflows and browser event streams are not claimed complete.
- Notification delivery currently means the private inbox. External channels will apply the saved quiet-hour policy.
- The next integration work is real frontend sessions/Tasks adapters and selecting/configuring an AI provider. The full S0 AI user journey is not declared complete merely because the gateway and durable history are available.
