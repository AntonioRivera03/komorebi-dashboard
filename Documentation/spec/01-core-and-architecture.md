# Core and architecture

[Specification index](../SPEC.md) · F0

## System shape

```text
Browser (React + TypeScript): one shell, Komorebi themes, independently loaded feature routes
       │ HTTPS: capability APIs, authenticated event stream
       ▼
Python/FastAPI application composition root
       ├── Planning modules          ├── Knowledge / study modules
       ├── Apartment modules         ├── Personal administration modules
       └── Today / assistant / voice / automation modules
                    │ injected platform ports
                    ▼
Core: identity, authorization, transactions, jobs, events, files,
      credential access, AI gateway, notification delivery, diagnostics
                    │
         ┌──────────┼──────────────────┐
         ▼          ▼                  ▼
   PostgreSQL   Private file store   Capability-owned service adapters
   owned schemas                    Home Assistant / calendar / AI / speech

Python worker: same Server project and release; executes durable jobs and event handlers
```

The composition root assembles modules. Core does not discover business behavior or import capability implementations. Capability adapters own provider semantics; core provides the transport primitives and credentials those adapters need.

## Module boundary

Each business module owns:

- Application commands and queries, domain rules and lifecycle states.
- Its database schema, migrations, repositories and indexes.
- Its pages, specialized components, request hooks and query-cache namespace.
- Its AI prompts and output interpretation, if any.
- Event production, subscriptions, job handlers, permissions and exports.
- Tests of its public contract and user-visible behavior.

Two capabilities may share a module when separating them would split one invariant. Sources and concept notes share `knowledge`; study sessions and resume checkpoints share `study`; devices and scenes share `home`; household lists and maintenance templates share `household`. These are explicit exceptions, not a rule that every fundamental becomes a module.

## Proposed repository layout

```text
Documentation/
  SPEC.md
  spec/
  design/
Web/                           # React + TypeScript + Vite project
  src/
    app/                       # browser shell and route composition
    shared/                    # Komorebi tokens and proven UI/API primitives
    capabilities/
      tasks/                   # route, pages, components, feature hooks
      knowledge/
      .../
  generated/                   # TypeScript API client/types from OpenAPI
Server/                        # Python + FastAPI project
  src/komorebi_server/
    app/                       # API/worker entrypoints and composition
    core/                      # identity, jobs, events, AI, files, operations
    shared/                    # server contracts and domain-neutral utilities
    capabilities/
      tasks/
        domain/
        application/
        infrastructure/
        api/
        migrations/
      knowledge/
      .../
  tests/
    architecture/
    integration/
    journeys/
```

All of this is one application project. Separate packages, release pipelines or service containers per capability are unnecessary. Small capabilities can start with a handful of files; do not generate empty architectural layers just to match the tree.

### Shared-folder policy

Shared placement does not transfer ownership. `Server/src/komorebi_server/shared/contracts/tasks` remains authored and versioned by Tasks. It contains Pydantic boundary models and interfaces, never Task repositories or private domain entities. Server consumers import these contracts, not another capability’s implementation. The frontend consumes generated OpenAPI types rather than importing Python or recreating request schemas by hand.

Promote a component to `shared/ui` after a second real consumer needs the same behavior and presentation. Define its stable props and accessibility contract; remove feature-specific service calls and terminology. Similar-looking but behaviorally different forms can stay separate.

Approved shared examples: button, field, dialog, focus indicator, date/time display, pagination, async-state panel, file-reference display, app-shell spacing and theme tokens. A reusable specialized widget may be exposed by its owner through an explicit contribution contract instead of becoming generic shared UI.

Prohibited shared examples: a universal mutable `AppState`, a shared ORM entity graph, one `services.ts` with all business operations, a generic JSON “life item” replacing owned records, and utility functions that know about exams or home devices.

### Dependency enforcement

| Importer | May import | Must not import |
| --- | --- | --- |
| Server shared contracts | Common Pydantic contracts and explicitly declared contract namespaces | Core implementations, capability implementations, database clients |
| Web shared UI/API | Shared styles, UI primitives and generated browser-safe API types | Capability services, private data access, Python/server source |
| Server core | Core modules and common server contracts | Any capability implementation or domain-specific contract |
| Capability server | Its own Python code, core public ports, allowed shared contracts | Other capability implementations, other schema repositories |
| Capability frontend | Its own TypeScript code, shared UI/styles and generated API client | Another capability’s pages/store/hooks; any Python/server source |
| Server composition | Module bootstraps and public contract types | Business rules, cross-schema SQL |

Architecture tests inspect imports and manifests. No deep imports, type-only imports of private entities, or re-exports that bypass a boundary. Runtime dependency cycles fail bootstrap validation. SQL repository tests and review enforce schema ownership; folder conventions alone are insufficient.

## What the core owns

| Core function | Owned state / behavior | Explicit exclusion |
| --- | --- | --- |
| K01 · Identity and authorization | User, sessions, paired devices, role/scopes, session revocation | Domain decisions such as whether an exam is publishable |
| K02 · Preferences and module configuration | Time zone, theme, locale, enabled modules, policy settings | Goal priorities, study plans or automation rules |
| K03 · Transaction and execution infrastructure | Transaction port, idempotency records, outbox, deliveries, job leases | Cross-module business transactions and orchestration |
| K04 · Private files and secrets | File metadata/bytes, credential references, access checks, encryption adapter | Source extraction semantics and provider-specific sync logic |
| K05 · AI gateway | Provider adapters, request policy, budgets, cancellation, usage records | Domain prompts, grading decisions, free access to all personal data |
| K06 · Notification delivery | Inbox messages, channels, quiet hours, deduplication, delivery attempts | Which home condition is an alert or which study item is due |
| K07 · Operational controls | Structured audit, health, metrics, retention jobs, backup/export coordination | A central business-event store as the application’s source of truth |

Persistent learning is implemented by Usage, Conversations, Memory and Evolution modules described in [F6](09-intelligence-and-evolution.md). Core exposes a domain-neutral observation sink whose Usage implementation is injected by composition. These modules do not turn Core into a store of all business logic.

Core capabilities are prerequisites delivered incrementally. Do not implement a generic framework before the first Tasks/Knowledge slice exercises the ports.

### Registration and composition

A module manifest declares its name, schema owner, provided ports, required ports, optional ports, event subscriptions, routes, job types, permissions and export handlers. The composition root wires concrete in-process functions to those ports.

```python
# Illustrative shape, not a dependency-injection library requirement.
calendar = create_calendar_module(
    platform=platform,
    tasks=tasks.public_api,
    provider=configured_calendar_adapter,
)

today = create_today_module(
    platform=platform,
    contributions=[tasks.today_reader, calendar.today_reader, home.today_reader],
)
```

Only the composition root sees implementations from different capabilities. A required missing port prevents enabling that capability with a clear configuration error. Optional integrations produce an explicit unavailable contribution or a disabled action. No capability relies on dynamic service-name lookups at arbitrary call sites.

## Frontend organization

The application shell owns session status, navigation, theme selection and route boundaries. Feature route groups own their layouts and local interactions:

| Route group | Page owner |
| --- | --- |
| `/today` | Today |
| `/capture`, `/goals`, `/tasks`, `/calendar` | Respective planning modules |
| `/learn/library`, `/learn/notes` | Knowledge |
| `/learn/sessions`, `/learn/resume` | Study |
| `/learn/review`, `/learn/exams`, `/learn/japanese`, `/learn/connections` | Respective learning modules |
| `/home`, `/home/scenes` | Home |
| `/home/alerts` | Home Alerts |
| `/life/training`, `/life/habits`, `/life/review`, `/life/people` | Respective life modules |
| `/life/household`, `/life/finance` | Household / Finance |
| `/briefing`, `/assistant`, `/voice`, `/automations` | Respective modules |
| `/history`, `/conversations`, `/memory`, `/improvements` | Usage / Conversations / Memory / Evolution |
| `/settings` | Core configuration UI assembled by the shell |

Each group loads independently and has loading, empty, error, stale-data and unauthorized states. React supports deferred loading of component code; apply it at meaningful feature boundaries. [React `lazy` documentation](https://react.dev/reference/react/lazy).

Browser API calls terminate at the owning module’s HTTP adapter. Use module-prefixed cache keys such as `['tasks', userId, 'list', filters]`; clear sensitive caches on logout and session-scope changes. Cross-feature changes arrive through explicit invalidation events or a refetch on navigation. Do not share mutable domain objects in a root store.

Today accepts typed contribution data and renders bounded shared card layouts. It links to canonical feature routes. Complex controls can be owner-supplied widgets registered by composition, with their own API calls; Today cannot import their internal state or business functions.

### Komorebi design contract

- Extract reusable tokens from the existing [light](../design/styles/komorebi/komorebi-light.css) and [dark](../design/styles/komorebi/komorebi-dark.css) styles. Those files include prototype-specific selectors; do not treat all of them as production shared CSS.
- Shared tokens cover paper/charcoal surfaces, olive/moss accents, primary/muted text, borders, focus states, spacing, typography, radius and restrained motion.
- Serif section headings and quiet surfaces remain consistent. Feature layouts adapt to their tasks: a study workspace need not have the same grid as Home.
- Scope feature CSS to its module/component. Avoid global element overrides from feature folders.
- Honor reduced-motion settings; support keyboard navigation, visible focus, labeled controls, touch targets and light/dark contrast.
- Start at 360px phone width and support tablet/desk/wall layouts. Shared display mode limits content server-side; CSS hiding is not a privacy control.

## Persistence and transaction boundaries

Use one PostgreSQL database with schemas such as `tasks`, `knowledge`, `study`, `home` and `platform`. Schemas organize and privilege objects but do not inherently prevent cross-schema access. [PostgreSQL schema documentation](https://www.postgresql.org/docs/current/ddl-schemas.html).

- Use schema-qualified repositories and a restricted runtime role; migration credentials remain separate. A single runtime role does not constitute hostile-plugin isolation: modules are trusted application code, constrained by tests and review.
- Each table has a stable ID and appropriate `user_id` or `household_id`; mutable records have revision and timestamps. Domain constraints are enforced both in application logic and appropriate database uniqueness/check constraints.
- Foreign keys and joins within a module are allowed. Cross-module business foreign keys, joins, triggers and direct writes are prohibited. Cross-module references are typed logical references validated through the owner’s interface.
- Core user/household identity references are a declared exception for foreign keys: deletion still follows the explicit export/deletion workflow, never an accidental cascade across the whole application.
- A command transaction updates one capability’s business tables. It may atomically write platform outbox, idempotency and audit records through the transaction port. This is the only general cross-schema write exception.
- Do not hold a database transaction open during network/AI calls. Reserve a job/operation, commit, call the external system, then persist the result with revision checks.
- Read models are owned by the consumer and carry source references, source revisions, freshness and rebuild metadata. They are not new sources of truth.

## Jobs, events and external sync

Execution is at least once. Durable messages and jobs carry an identity, actor scope, module, type/version, correlation ID and retry policy. Use database leases so multiple workers cannot claim the same attempt concurrently; a lost lease may still lead to duplicate delivery, so handlers remain idempotent.

Outbox records commit with the source change. Dispatchers deliver to declared subscriptions; each consumer records a unique `(consumer, event_id)` receipt atomically with its local effects. External effects require their own operation ledger and provider reconciliation, not just the receipt.

Retries use capped backoff, limits and terminal states. Poison messages go to a visible failed queue. Operators can retry an eligible job; a dangerous or non-idempotent external action is not blindly replayed. Per-aggregate revisions protect against out-of-order updates. Jobs recheck permissions and input revisions when they run.

Calendar and home adapters own connection state, cursors, subscription lifecycle, provider ID mappings and reconnect behavior. Shared core may provide credential storage, HTTP transport, retry helpers and a clock. It must not grow a central “integration manager” that owns every provider’s business behavior.

## Identity, privacy and permissions

Baseline roles are `owner` and `display`. Start with one owner account and explicit device pairing; keep a real session model so a second trusted user can be added later. Multi-tenant SaaS is out of scope.

- Authenticate with a vetted server-side session implementation; do not invent password cryptography. Final identity provider/local sign-in choice is a bootstrap decision.
- Sessions use secure, HttpOnly cookies with CSRF protection for state-changing requests, expiration and revocation. Remote access requires TLS; a local-network address is not authentication.
- Owner sessions can operate enabled capabilities. A display session has explicit read/control scopes, for example public calendar summaries and named light scenes. It cannot retrieve private notes, finances, source files or raw assistant conversations.
- Every command/query checks scope and record ownership. IDs, contribution requests, search and event subscriptions are not authorization bypasses.
- Keep provider tokens and encryption keys off the browser. Store only secret references in capability connection records. Encryption keys live outside the database and its backup; use an established encryption facility.
- Uploaded documents and external pages are untrusted. Limit size/type, sanitize rendered content, isolate extraction, disable script execution and reject arbitrary server-side URL fetches to local/private addresses. Explicitly configured Home Assistant endpoints use a separate allowlisted integration path.
- Retrieved source text and voice transcripts are data, never privileged instructions to the assistant or automation engine.

## Data retention and portability

Proposed defaults, editable before release:

| Data | Retention behavior |
| --- | --- |
| Notes, goals, sources, attempts and personal logs | Retain until user deletion; archive is not deletion |
| Raw voice command audio | Delete after transcription by default; keep only with explicit choice |
| Japanese practice recordings | Keep when the user explicitly saves the attempt; delete with it |
| Conversations across assistant and feature chats | Persist messages, revisions, tool references and context links by default until explicit deletion; no automatic 24-hour expiry |
| Meaningful usage, feedback, memory and improvement history | Durable product records until explicit deletion or a deliberately chosen archive policy; independent of operational-log cleanup |
| AI interaction history | Persist application-visible inputs/outputs, source revision references, tool calls/results, prompt/model versions and usage; redact credentials; hidden model reasoning is not collected |
| Operational AI diagnostics | Sanitized transport/debug metadata may expire after 30 days; this does not delete durable interaction history |
| Successful job payloads / event deliveries | Prune after 30 days once all required consumers acknowledge; retain compact deduplication records as needed |
| Unprocessed/failed messages | Retain until resolved or explicitly abandoned; never delete on the success retention schedule |
| Audit and integration operations | Preserve action/result metadata needed for history and reconciliation; disposable debug logs may expire after 90 days |
| Backups | Daily, seven daily + four weekly copies as an initial home-install policy |

A replay has a declared maximum age. Maintain idempotency receipts longer than that window, or perform a controlled rebuild using current snapshots rather than replaying pruned messages. Source tables remain the authoritative rebuild source; the application is not event-sourced.

Export produces a manifest plus module-owned JSON/Markdown data and original files, including typed references and schema versions. It excludes credentials. Deletion first hides/tombstones the record, invalidates search/AI projections, then purges dependent derived data and files. Delayed events must not recreate deleted records. Physical backups expire separately; disclose that retention window.

Restore into an isolated installation, run migrations, verify reference integrity and rebuild projections. External write jobs stay paused until the operator reconciles provider state, preventing a restored backup from repeating old actions.

## Deployment and scalability

Begin with a FastAPI application server, one Python worker role, the Vite-built frontend, PostgreSQL and a private volume on a Linux host. Web and Server have separate build toolchains but are versioned and released together. An external Home Assistant installation remains the device authority.

Scale by evidence: paginate lists; index owned query patterns; use bounded AI/extraction queues; prioritize interactive home/calendar operations above bulk imports; lazy-load routes; cache timestamped summaries. Multiple web/worker processes may use the same release once database leases and idempotency are verified. Provider subscription ownership must be leased per connection to avoid duplicate listeners.

Do not add a broker, vector cluster or split service simply because a future scale scenario exists. Extracting a capability into a service is a later option only if deployment, reliability or load measurements justify the operational cost. The same contract and ownership boundaries make that possible without requiring it today.

## Proposed operational acceptance targets

Targets are to be measured on declared hardware and fixtures; they are not guarantees of provider/model latency.

- On a reference home server, common local read requests: p95 under 300ms with 10 concurrent clients and a fixture of 10,000 tasks, 10,000 notes and 100,000 attempts. Exclude external calls and report their latency separately.
- Today: useful local content within two seconds on the reference LAN; each failed/slow contribution times out independently.
- Commands needing network work return a tracked operation within one second; no fake success before provider confirmation.
- Event-driven projections converge within five seconds under ordinary load; display observed freshness when queues are delayed.
- Long jobs survive worker restarts. One failing provider does not stop unrelated jobs.
- Daily backups target an RPO of 24 hours; exercise a restore with an RTO target of two hours on the chosen hardware.
- Health distinguishes liveness, database readiness, worker heartbeat and per-provider degradation. Logs carry correlation IDs and omit secrets, raw source text and transcripts by default.
