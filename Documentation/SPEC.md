# Komorebi — application specification

Status: proposed technical baseline, ready for review and capability-by-capability implementation.  
Revision: 3 · 5 September 2026. Python/FastAPI server and React/TypeScript frontend selected. AI, persistence and learning-from-use remain foundational; autonomous evolution scope awaits the remainder of the user brief.  
Architecture: **capability-oriented modular monolith**.

Komorebi is a personal application for managing commitments, learning and retaining knowledge, and controlling the apartment. Its purpose is to reduce coordination work and make meaningful progress easier. AI and connected services are first-class parts of the intended product. Capabilities may require them; lack of a currently configured connection is a setup requirement, not a reason to exclude functionality. The application records conversations, meaningful usage and outcomes so it can develop persistent context and improve over time. Provider outages require honest recovery behavior, not a mandatory equivalent non-AI implementation.

This specification defines the intended system. The repository currently contains design concepts, styles, a proposal and discussion notes; it does not yet contain the application described here. Technology choices below are proposed defaults, not claims about existing implementation.

## Reading map

| Document | Defines |
| --- | --- |
| [Core and architecture](spec/01-core-and-architecture.md) | Module structure, platform responsibilities, frontend boundaries, storage, security, deployment and scalability |
| [Contracts and system interactions](spec/02-contracts-and-interactions.md) | Data ownership, synchronous interfaces, events, AI execution and cross-capability workflows |
| [Planning and commitments](spec/03-planning.md) | Capture, goals, tasks, calendar and capacity planning |
| [Learning and knowledge](spec/04-learning.md) | Sources, notes, study sessions, review scheduling, exams, Japanese, checkpoints and connections |
| [Apartment control](spec/05-home.md) | Devices, scenes, state confirmation and home alerts |
| [Personal routines and administration](spec/06-life-management.md) | Training, habits, reflection, relationships, household work and finances |
| [Daily information and assistance](spec/07-information-and-automation.md) | Today, briefings, assistant, voice and automation rules |
| [Persistent intelligence and evolution](spec/09-intelligence-and-evolution.md) | Usage auditing, durable conversations, personal memory and evidence-driven improvement |
| [Delivery and verification](spec/08-delivery.md) | Build slices, dependency ordering, quality gates, acceptance scenarios and decisions to resolve |

The capability sections specify behavior, ownership, interfaces, AI use, failure handling and acceptance criteria. The contract document defines the shared rules those sections rely on. The delivery document turns the design into buildable increments without making every requested feature a prerequisite for the first release.

## Product fundamentals

A **fundamental** is a user need that groups related capabilities. It is an information-architecture grouping, not a shared database, giant service or mandatory parent module.

A **capability** is a coherent function with its own behavior, state, pages, tests and public interface. Some tightly related capabilities share a module where they have the same lifecycle and invariants. Each mapping is explicit below.

| Fundamental | The application must help you… | Owned capabilities |
| --- | --- | --- |
| F0 · Reliable application core | Trust access, persistence, execution and portability | Identity, preferences, transactions, jobs, events, files, AI gateway, notifications and operational controls |
| F1 · Planning and commitments | Capture intentions and turn selected ones into feasible action | P01–P05: capture, goals, tasks, calendar, capacity |
| F2 · Learning and knowledge | Understand, practise, retrieve, apply and revisit information | L01–L08: sources, notes, sessions, reviews, exams, Japanese, checkpoints, connections |
| F3 · Apartment control | Operate the home and understand its actual state | H01–H03: device controls, scenes, alerts |
| F4 · Personal routines and administration | Support health and ordinary life without excessive tracking | M01–M07: running, habits, reflection, relationships, shopping, maintenance, financial reminders |
| F5 · Daily information and assistance | See relevant information and reduce repetitive coordination | I01–I05: Today, briefings, assistant, voice, automation |
| F6 · Persistent intelligence and evolution | Let the application learn from interactions and improve with accumulated context | E01–E04: usage history, conversations, memory and improvement evaluation |

## Scope and user priorities

The latest correction establishes AI, usage auditing and persistent chat/context as foundational requirements; it supersedes the earlier manual-first framing. The exact authority to change application behavior or code is pending clarification. Inputs also include the [proposal](proposal.html), your architectural instructions and [exported discussion choices](discussion-notes.md). The selections are preferences, not a commitment to deliver every essential in the first release.

- **Essential** means explicitly selected in those notes, or necessary to support an explicitly selected feature.
- **Interested** means selected as interested; provide the interface boundary but schedule the capability deliberately.
- **Undecided** means still considering; do not silently elevate it into release scope.
- **Derived** means this specification introduces a technical or behavioral prerequisite and identifies it as such.

| ID | Specific feature | Module | Priority |
| --- | --- | --- | --- |
| P01 | Capture items and convert them into tasks or notes | `capture` | Essential |
| P02 | Define goals, milestones and linked next actions | `goals` | Essential |
| P03 | Manage tasks, recurrence and completion | `tasks` | Essential · derived from goals/calendar |
| P04 | View calendar events and schedule task blocks | `calendar` | Essential |
| P05 | Suggest tasks that fit available time and energy | `capacity` | Undecided |
| L01 | Import study sources with traceable locations | `knowledge` | Essential |
| L02 | Write, link and search concept notes | `knowledge` | Essential |
| L03 | Run study sessions and record practice attempts | `study` | Essential |
| L04 | Schedule spaced reviews from attempt history | `reviews` | Interested |
| L05 | Build exam plans and grade practice attempts | `exams` | Essential |
| L06 | Practise Japanese communication skills | `japanese` | Essential |
| L07 | Save and resume a learning checkpoint | `study` | Essential |
| L08 | Suggest evidence-linked connections between notes | `connections` | Essential |
| H01 | Control devices and reconcile reported state | `home` | Essential |
| H02 | Apply and edit named room scenes | `home` | Essential · part of selected home controls |
| H03 | Detect and acknowledge home exceptions | `home-alerts` | Essential |
| M01 | Schedule a running plan and log sessions | `training` | Undecided |
| M02 | Track cue-based routines and fallback actions | `habits` | Undecided |
| M03 | Review weekly activity and record adjustments | `reflection` | Undecided |
| M04 | Keep personal dates and contact reminders | `relationships` | Undecided |
| M05 | Manage household shopping lists | `household` | Essential |
| M06 | Schedule chores, maintenance and renewals | `household` | Essential |
| M07 | Track bills, subscriptions and savings targets | `finance` | Interested |
| I01 | Assemble a bounded Today dashboard | `today` | Essential |
| I02 | Generate a sourced daily information briefing | `briefings` | Essential |
| I03 | Ask questions and preview application actions | `assistant` | Essential |
| I04 | Capture speech and route supported voice commands | `voice` | Essential |
| I05 | Run explicit event-and-condition automation rules | `automation` | Undecided · cross-domain routines |
| E01 | Record feature usage and workflow outcomes | `usage` | Essential · latest correction |
| E02 | Persist and retrieve conversations across features | `conversations` | Essential · latest correction |
| E03 | Build evidence-linked personal memory | `memory` | Essential · derived from persistent context |
| E04 | Evaluate and track application improvements | `evolution` | Essential direction · autonomous-change scope pending |

Renamed features preserve the proposal’s intent. “Unexpected connections” becomes L08, with actual inputs, review and acceptance behavior. “An assistant that can show its work” becomes I03, with source references and an explicit action lifecycle. “A calm Today view” becomes I01, with a bounded contribution contract and freshness rules.

## Architectural commitments

1. **One project and coordinated release.** A web application and its background execution use the same source tree, contracts, migrations and release version. A worker process is an execution role of the monolith, not a separate service boundary.
2. **Capability ownership.** Only a capability’s application layer can change its records. Other capabilities issue commands or consume versioned facts. Sharing one database never authorizes cross-module SQL.
3. **A small core.** Core implements execution, access and infrastructure primitives. Goal logic, review scheduling, home scenes, briefing ranking and automation workflows stay outside it.
4. **Explicit coupling.** Dependencies are named in manifests and injected at composition time. Cross-module dependencies must be acyclic. Events do not justify hidden circular workflows.
5. **Shared code has a reason and an owner.** Reusable frontend styling/components live in `Web/src/shared/`; shared server contracts and infrastructure interfaces live in `Server/src/komorebi_server/shared/`. Business implementations and specialized UI remain in their capability.
6. **One visual language, independent feature pages.** Komorebi light/dark tokens, accessibility, typography and layout conventions are shared. Feature forms, state and workflows are not a global frontend store.
7. **AI is a first-class application dependency.** Modules use AI for interpretation, tutoring, synthesis and personalization. Core supplies provider execution and policy; durable conversations and memory supply context through explicit contracts. State changes still use capability-owned commands.
8. **Learn from actual use.** Record meaningful interactions, outcomes, feedback and model/tool runs durably. Preserve source history separately from inferred memory and improvement proposals.
9. **Failures are represented.** Pending sync, unavailable devices, stale data, failed extraction and AI failure are visible states, not successful empty results.
10. **Portability and recovery are product requirements.** Durable notes, history and relationships can be exported, deleted and restored with their ownership intact.
11. **Build vertical slices.** A capability includes domain behavior, storage, API, UI, permissions, degraded states and tests before it is called complete.

“Independent” means a capability can change internally without changing unrelated modules. It does not mean zero integration work: changing a public contract, shared visual component or user journey requires deliberate compatibility checks.

## Proposed technical baseline

| Concern | Proposed choice | Reason and limit |
| --- | --- | --- |
| Frontend language | TypeScript | Strong browser tooling, typed generated API clients and maintainable React feature code |
| Browser | React with Vite | Client-side feature routes, fast development and independently loaded capability pages |
| Server language | Python | Strong AI, document-processing, data-analysis and experimentation ecosystem |
| HTTP application | FastAPI with Pydantic | Thin API adapters, runtime validation and OpenAPI as the explicit browser/server contract |
| Database | PostgreSQL, one database with capability schemas | Transactions and useful indexing/search without separate data services per capability |
| Data access | Python migrations and a typed SQL access layer | Module-scoped repositories; select SQLAlchemy/SQLModel or another concrete library during the first persistence slice |
| Background work | Python worker using durable PostgreSQL-backed jobs and outbox | Same server codebase and release; no initial broker or Redis dependency |
| Files | Private filesystem volume initially; object-storage adapter contract | Source uploads, extracted text and audio remain private; immutable file IDs abstract physical location |
| Search and memory | PostgreSQL records with lexical and semantic retrieval interfaces | Persist canonical conversations/events/memory; embeddings are derived indexes. Select a vector storage implementation during the early memory slice |
| Home integration | Server-side Home Assistant adapter | Reuse device integrations; mirror only the state required by Komorebi |
| External services | Capability-owned adapters through shared credential/transport infrastructure | Configure required providers for each enabled feature; missing setup does not remove the feature from scope |
| Deployment | Self-hosted Linux/container deployment, web + worker + PostgreSQL | Proposed fit for local apartment control; remote access and target hardware need confirmation |

The initial project setup pins the React/Vite and FastAPI/Pydantic foundations in their lockfiles. Select and pin the router, generated OpenAPI client tool, database library, migration runner and job implementation when the first capability needs them. A provider or deployment constraint may change an adapter or transport choice; it must not change the ownership rules.

No microservices, runtime plugin marketplace, generic workflow language, event-sourced database, distributed transaction coordinator, separate search cluster or multi-tenant SaaS is required for the baseline.

## Intended first useful experience

A signed-in user discusses an intention with AI, retains that conversation, turns it into a next action or a source-linked note, schedules a task if desired, completes an AI-supported study session, and resumes later with its history and context available. Meaningful interactions and corrections are recorded from the first slice. Today displays a few selected items beside calendar commitments and real home controls. Each interaction works through the owning capability; Today and the assistant never become alternate owners of those records.

The first release need not include every essential. [Delivery slices](spec/08-delivery.md) preserve a route toward all selected essentials, including Japanese, exams, connections and voice.

## Decisions that remain open

| Decision | Working assumption | Resolves before |
| --- | --- | --- |
| Hosting and hardware | Private self-hosted application with a local Home Assistant endpoint | Deployment/bootstrap |
| Identity and shared screens | One owner account; paired, restricted display sessions | Identity implementation |
| Calendar/task provider | Internal tasks; calendar read integration followed by controlled writes | Calendar adapter |
| Existing notes and Anki | Import/export first; no assumed live bidirectional sync | Knowledge/review integration |
| AI provider and disclosure | Configure a required AI provider and data-use policy in the early foundation slice | First AI-enabled journey |
| Japanese level and goals | Configurable communication targets, no inferred proficiency | Japanese curriculum content |
| Running baseline | User-defined plan/logging only; no generated progression | Training capability |
| Costs and retention | Durable chat, usage and memory by default; configurable raw-media retention and execution budgets | Initial persistence design |
| Autonomous evolution | Evidence collection, memory and improvement records are included; authority for automatic behavior/code changes awaits the completed brief | Automated change execution |

These decisions guide integration setup and implementation order. A feature requiring AI, a device or an external account remains in scope with an explicit dependency and connection/setup state.
