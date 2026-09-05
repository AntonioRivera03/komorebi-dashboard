# Delivery, verification and change policy

[Specification index](../SPEC.md)

## Build by capability

A build slice is a usable vertical increment: feature behavior, owned persistence, public contracts, UI, access policy, error states and relevant tests. It is not “all database tables,” followed by “all backend,” followed by “all frontend.”

The table below is dependency ordering, not a dated delivery commitment. Finish and evaluate a small slice before expanding its feature set. A selected Essential may be delivered later because it depends on earlier primitives; Interested/Undecided capabilities are not silently required by it.

| Slice | Deliverable | Depends on | Demonstration that ends the slice |
| --- | --- | --- | --- |
| S0 | Core + Komorebi shell + AI connection + E01/E02 minimal history | Runtime/identity/AI provider setup | Sign in, complete an AI interaction, retrieve its persisted messages and usage outcome, and load one isolated route |
| S0b | E03 initial memory + E04 evidence/evaluation records | S0 | Retrieve a source-linked preference from earlier chat, correct it, and inspect an evidence-backed improvement candidate; autonomous execution scope pending |
| S1 | P03 Tasks + P01 text capture-to-task path | S0; minimal transactions/idempotency | Capture, convert, complete and revisit history; retry conversion without duplication |
| S2 | P02 Goals and milestone/action links | S1 | Define an outcome, link a task and see completion evidence without auto-completing the goal |
| S3 | L01/L02 Knowledge and P01 note/source conversion | S0; Files/jobs as needed | Import a supported document, write a note and find a passage with its location; retry failed extraction |
| S4 | L03 AI-supported Study + L07 contextual checkpoints | S3 + S0/S0b | Discuss a source, answer a prompt, retain dialogue/attempts and resume with the prior context after restart |
| S5 | P04 Calendar: read-only provider + internal blocks, then reviewed writes | S1; provider decision | See real commitments, schedule an internal task block and display provider sync/conflict status |
| S6 | H01/H02 Home: one room and supported entity types | S0; Home Assistant setup | Apply a scene, observe real confirmation and display a partial result when one device is unavailable |
| S7 | I01 Today + H03 alerts | S1/S4/S5/S6 contributions as available | See a bounded dashboard; one failed producer does not block it; acknowledge a real configured alert |
| S8 | M05/M06 household lists and maintenance | S1; Home link optional | Purchase an item; complete maintenance and generate one next occurrence |
| S9 | Richer Study feedback + L08 connections | S3/S4; existing AI/history foundation | Review a sourced prompt draft and accept an evidence-linked connection; injected document instructions cannot execute a tool |
| S10 | L05 Exam practice | S4; AI-backed generation/assessment | Configure a small syllabus, run a practice set and inspect a rubric-linked result and error log |
| S11 | L06 Japanese practice | S4; chosen materials; speech optional | Complete a communication exercise and inspect assistance level and reference-linked feedback |
| S12 | I02 Briefings + I03 Assistant | S3/S5; registered module tools; S0 AI gateway and S0b memory | Read a sourced bounded digest; preview and confirm one supported action with stale-proposal protection |
| S13 | I04 push-to-talk voice | S1/S6; speech adapter decision; Assistant optional | Transcribe an intentional request and execute one permitted command without duplicate delivery |
| S14 | Optional extensions | Explicit scope choice | L04 Reviews, P05 Capacity, M01–M04 personal routines, M07 Finance or I05 Automation each meets its own acceptance criteria |

Core execution primitives grow when needed: extraction introduces jobs; the first cross-module projection exercises the outbox; the first AI-enabled slice already includes the gateway and durable interaction records. Each primitive must have operational behavior before it carries real work, but S0 need not implement an unused general framework.

Home-device and AI-learning slices have distinct provider dependencies. They can be implemented independently within the same project. Likewise, specialized learning depends on Study contracts, not on each other’s UI or storage.

## Capability definition of ready

Before implementing a slice:

1. Name the capability IDs included and what is deferred within them.
2. Select the canonical pages and one complete user journey.
3. Identify data owner, schema/migrations, state transitions and retention.
4. Define input/output validation, permissions, revision rules and idempotency keys.
5. List required/optional ports, emitted facts, subscriptions and provider needs.
6. Declare AI/integration dependencies, setup states, recovery behavior and the history/feedback recorded. An equivalent non-AI path is not a completion requirement.
7. Select concrete acceptance scenarios from this spec and add provider-specific cases only where needed.

## Capability definition of done

- User behavior works through real owned persistence, with no fake-success integrations or sample values presented as live data.
- HTTP/UI adapters use the module’s application operations; no cross-module private imports or SQL.
- Unit tests cover meaningful domain rules. Repository/integration tests cover constraints, concurrency and transactions. Contract tests verify public payloads and consumer compatibility.
- Required degraded-state, permission, revision, idempotency and deletion scenarios pass.
- The feature uses Komorebi tokens and shared components appropriately, and keyboard/mobile behavior is verified when implementing the UI.
- Migrations are repeatable on a clean database and safe on the supported previous schema. Background handlers can read already-queued payload versions through the release transition.
- Logs/metrics identify failures without recording secrets or unnecessary personal content.
- Meaningful interactions, chat context, AI/tool runs and accepted/edited/dismissed outcomes are stored in their durable history owners. Disposable diagnostics are not the only record of how the capability was used.
- Export and deletion hooks exist for newly introduced personal data; file/job cleanup is covered.
- Module enable/disable behavior is defined and tested. Disabled modules retain data, hide routes/tools/contributions and stop new work. Disabling a required provider first reports its dependent modules and requires those dependents to be disabled together; optional consumers degrade independently. Pending jobs are paused or canceled deliberately; re-enable reconciles before replaying external effects.
- The spec/decision record is updated when implementation changes the contract rather than silently diverging.

## Test strategy

| Layer | Verify | Avoid |
| --- | --- | --- |
| Architecture | Allowed imports, contract ownership, acyclic declared dependency graph, route/module registration | Treating a folder naming convention as enforcement |
| Domain | Recurrence, revision conflict, assessment eligibility, scene restoration conditions | Tests that merely repeat getters or static markup |
| Repository | Uniqueness, scoped reads, transaction rollback, outbox atomicity | Assuming an in-memory fake proves SQL behavior |
| Contract | Runtime schemas, old queued event compatibility, DTO privacy | Importing producer implementations into consumer unit tests |
| Integration | At-least-once delivery, leases, provider timeout/reconnect, deletion propagation | Real external side effects in ordinary CI |
| User journey | Capture-to-task, source-to-attempt, scene acknowledgement, reviewed calendar action | One giant end-to-end suite as the only correctness evidence |
| AI evaluation | Citation resolution, groundedness, prompt injection resistance, action-policy enforcement, costs/timeouts | Assuming a fluent answer is correct or snapshotting nondeterministic prose |
| Recovery | Backup restore, projection rebuild, paused external jobs, secret recovery requirements | Declaring backups sufficient without a restore exercise |

Provider adapters use deterministic fakes in ordinary tests and a separately enabled integration environment for real compatibility checks. AI evaluations include known-answer fixtures, missing evidence, conflicting sources, malicious source instructions and unavailable providers. Each evaluation records model/prompt versions and its criteria.

## Critical system acceptance scenarios

1. **Capture conversion loses its response.** Retry returns the same destination record, and the original remains available.
2. **Consumer crashes after source commit.** Its outbox event is eventually handled; applying the same event again has no duplicate local effect.
3. **Calendar write times out after send.** The operation is `unknown_outcome` until reconciled, not automatically retried as a new event.
4. **A scene partly works.** Each target has its own result, and manual changes survive a later conditional restore.
5. **AI feedback fails.** The Study answer remains persisted; the user can continue with manual feedback.
6. **A source is deleted during generation.** The result is rejected/redacted; no answer, search cache or delayed event resurrects its contents.
7. **An assistant proposal becomes stale.** Confirmation rechecks scope/revisions and requests a revised preview instead of changing the new state.
8. **A display tries a private route/tool.** The server rejects it, including through search, voice, contributions and background jobs.
9. **A specialized learning module is disabled.** Study/Knowledge remain usable; its pending assessment work is explicitly paused.
10. **A maintenance completion event is duplicated.** One next occurrence is created.
11. **A daylight-saving boundary occurs.** Calendar/task recurrence follows the chosen local-time policy without duplicate logical occurrences.
12. **The worker/database/server restarts.** Durable work resumes with leases/idempotency, while expired device commands do not replay.
13. **A required provider is unavailable.** Preserve inputs/history, show connection or retry state, and resume eligible work after recovery. Do not remove the feature from scope or require a replacement non-AI workflow.
14. **A backup is restored.** Records/files/references reconcile and external write jobs remain paused until checked.
15. **A new capability is added.** Its registration, schema and pages fit the existing public contracts without editing unrelated feature internals.
16. **A chat continues after restart.** The original messages, relevant context revisions and interrupted/completed run states are retrievable.
17. **A remembered preference is corrected.** Future retrieval uses the correction, preserves its evidence and does not restore the old inference from a delayed extraction job.
18. **An improvement is proposed.** It links to recorded usage or explicit user feedback and declares evaluation criteria; automatic change authority is resolved separately from evidence collection.

## Change and extension procedure

For a new capability, create its module, owned schema and route group; add the minimum owned public contract under `shared/contracts`; declare dependencies; bind ports and route/contribution registrations in composition. Changes to navigation/composition are expected. Changes to other modules’ private code are a signal that the boundary may be wrong.

For a second UI consumer, decide whether the behavior is truly shared. If yes, move the primitive/pattern into `shared/ui` with stable props and update its consumers. Do not promote domain rules or a private service just to make an import error disappear.

For a public contract change, inventory declared consumers, choose additive evolution or a new version, update fixtures and account for queued jobs/events. For a database change, only the owner writes migrations; use expand/migrate/contract when old jobs or rolling processes must coexist. Do not combine a destructive schema change with an unverified data backfill.

Keep architectural decisions in short records under `Documentation/decisions/` when implementation makes a choice. Initial records should cover the monolith/boundaries, database isolation policy, identity/display scopes, calendar ownership, AI disclosure, scheduler choice and deployment/backup approach. A record needs the decision, reasons, alternatives materially considered and consequences—not a transcript of discussion.

## Proposal-to-spec traceability

| Original proposal feature | Concrete capability IDs |
| --- | --- |
| A calm Today view | I01 |
| Goals that reach the calendar | P02, P03, P04 |
| One place to put things | P01 |
| A calendar that understands tasks | P03, P04 |
| Plan for the day you actually have | P05 |
| A complete learning session | L03 |
| A knowledge library with provenance | L01, L02 |
| Review that fits your life | L04 |
| An exam preparation studio | L05 |
| Japanese you can use | L06 |
| A return ticket to any topic | L07 |
| Unexpected connections | L08 |
| Rooms, scenes and honest status | H01, H02 |
| Routines that connect home and life | I05, consuming H02 and L03 facts |
| Only the home information that matters | H03 |
| A voice doorway | I04 |
| Running goals with a real baseline | M01, linked to P02/P04 |
| Flexible routines and fallback actions | M02 |
| A weekly review with perspective | M03 |
| People and experiences stay visible | M04 |
| Less recurring household admin | M05, M06 |
| A financial awareness shelf | M07 |
| A briefing with an attention budget | I02 |
| An assistant that can show its work | I03 |

This specification replaces abstract labels for implementation discussion while retaining all 24 proposal ideas and their recorded priority. The original mapping defines 28 product capabilities; revision 2 adds E01–E04 for usage, conversations, memory and evolution, bringing the total to 32 plus seven core platform functions; splitting a title does not imply a separate service or release.

## Scope gates before provider-specific work

- Confirm the machine/deployment target and authentication approach before exposing the application.
- Inventory real Home Assistant entities and choose permitted actions before writing actuator adapters.
- Select calendar account/provider and read/write scopes before sync implementation; internal blocks can be built independently.
- Choose cloud/local AI and speech policy, budget and data retention before transmitting personal source content or recordings.
- Clarify the first exam/Japanese learning objective before authoring curriculum or claiming coverage.
- Clarify current running capacity and the chosen plan before implementing personalized training content.

These gates ask for concrete missing configuration at the relevant slice. They establish setup requirements for the intended connected application; absent credentials do not remove a capability from scope.
