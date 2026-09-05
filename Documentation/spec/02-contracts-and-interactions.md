# Contracts, shared data and capability interactions

[Specification index](../SPEC.md)

## Sources of truth

Every reference across a boundary names its owner. Consumers may cache a projection but cannot edit it as if it were the original.

| Data / invariant | Authoritative owner | Consumers and allowed use |
| --- | --- | --- |
| User, household, session and device scopes | Core Identity | Every module authorizes requests; no duplicated identity logic |
| Captured item and conversion status | Capture | Tasks/Knowledge receive a conversion request; Today can show inbox count |
| Goal, milestone and goal-to-action links | Goals | Today/Reflection read summaries; Tasks owns linked action completion |
| Task, recurrence series and task occurrence | Tasks | Calendar schedules; Goals links; Household/Habits can request occurrences |
| Provider event mirror and internal scheduled block | Calendar | Today/Capacity/Briefings query time ranges; never infer task completion from event end |
| Source, immutable source revision, concept note and approved note relation | Knowledge | Study/Exams/Japanese retrieve authorized content; Connections proposes links |
| Practice prompt, immutable prompt revision, session, attempt and checkpoint | Study | Reviews schedules prompts; Exams/Japanese derive their own progress views |
| Next review date and scheduler history | Reviews | Today shows due summary; Study never imports review scheduling internals |
| Exam syllabus, blueprint and practice-result interpretation | Exams | Study supplies raw attempts; Calendar can schedule proposed preparation blocks |
| Japanese skill target, curriculum mapping and evidence assessment | Japanese | Study supplies prompt/attempt records; Goals can link a skill target as evidence |
| Connection suggestion, approval and dismissal | Connections | Knowledge stores the accepted relation; assistant can cite accepted links |
| Home device mapping, state mirror and command operation | Home | Home Alerts/Today/Automation consume state; Home Assistant/device remains authoritative for observed state |
| Scene definition and scene execution | Home | Voice/Automation issue a named scene command, not raw device calls |
| Home alert rule and alert instance | Home Alerts | Notifications delivers; Today shows acknowledged/unacknowledged summaries |
| Running plan and workout log | Training | Calendar schedules; Goals/Reflection query summaries |
| Habit definition and check-in | Habits | Tasks may supply optional action occurrences; Reflection reads consistency with context |
| Reflection narrative and chosen adjustments | Reflection | Assistant may retrieve with permission; other modules execute explicit adjustment commands |
| Person reminder and personal date | Relationships | Tasks/Calendar can receive an explicit reminder request |
| Shopping item and maintenance template | Household | Tasks owns generated chore/renewal occurrences |
| Bill/subscription record and savings target | Finance | Calendar/Tasks receive minimal reminder data; restricted summaries only |
| Today arrangement, dismissed items and temporary cached contributions | Today | No other module treats it as a source of task/learning/home truth |
| Feed subscriptions and briefing snapshot | Briefings | Today links to a briefing; each item preserves its source/freshness |
| Conversation/message revisions, context and tool-run references | Conversations | Assistant and feature AI sessions append through one persistence contract; Memory derives context from this history |
| Retrieval run and action proposal/execution | Assistant | Conversations references these records; owning capabilities execute typed actions |
| Usage events, workflow outcomes and feedback | Usage | Memory and Evolution read scoped histories/aggregates |
| Personal facts/preferences inferred from evidence | Memory | Assistant and feature AI callers retrieve relevant context; source records remain authoritative |
| Improvement candidates, evaluations and changes | Evolution | Uses evidence from Usage/Memory; autonomous execution authority remains to be specified |
| Voice request/transcription lifecycle | Voice | Routes to Home/Capture/Assistant using the caller’s scopes |
| Automation rule, run and step ledger | Automation | Calls registered capability commands under a constrained run identity |

## Public interface types

These TypeScript shapes illustrate the browser-visible result. Author the authoritative request/response models in Python with Pydantic, publish them through FastAPI’s OpenAPI document, and generate the TypeScript client/types used by `Web/`. Do not maintain independent handwritten browser schemas.

```ts
type ResourceRef = {
  owner: string;              // registered module name
  kind: string;               // contract-defined kind, not an arbitrary table
  id: string;
  revision?: number;
};

type RequestContext = {
  actorId: string;
  householdId: string;
  sessionId?: string;
  principal: 'user' | 'display' | 'automation' | 'job';
  scopes: readonly string[];
  correlationId: string;
}; // Server-constructed after authentication; never trusted from request JSON.

type CommandMeta = {
  idempotencyKey: string;
  expectedRevision?: number;
};

type Operation<T> =
  | { status: 'completed'; value: T }
  | { status: 'pending'; operationId: string; pollUrl: string }
  | { status: 'failed'; code: string; retryable: boolean };

type Snapshot<T> = {
  data: T;
  observedAt: string;
  freshness: 'current' | 'stale' | 'unknown';
  sourceRevision?: string;
};
```

Opaque references do not grant access. The receiver validates the reference kind, checks permissions through its owner and handles `not_found`, `forbidden`, `archived` and `revision_conflict`. Historical references may remain as redacted tombstones; deleted text must not leak through stale projections.

### Commands, queries and events

- **Command:** request a change, validate it at the owning module and return completion or a tracked operation. In-process function calls are the default between modules.
- **Query:** request a bounded authorized view with freshness. Public query DTOs omit private/internal fields.
- **Event:** a fact that already committed. Consumers update local projections or trigger their own explicit workflows. Events are not requests with misleading past-tense names.

| Owner | Representative public operations | Published facts |
| --- | --- | --- |
| Capture | `captureItem`, `convertToTask`, `convertToNote`, `getConversion` | `capture.itemConverted.v1` |
| Goals | `createGoal`, `addMilestone`, `linkTask`, `getGoalSummary` | `goals.goalChanged.v1` |
| Tasks | `createTask`, `completeOccurrence`, `updateTask`, `listActionCandidates`, `getTask` | `tasks.taskChanged.v1`, `tasks.occurrenceCompleted.v1` |
| Calendar | `listAgenda`, `proposeBlock`, `confirmBlock`, `cancelBlock`, `getSyncStatus` | `calendar.blockChanged.v1`, `calendar.providerEventChanged.v1` |
| Knowledge | `importSource`, `createNote`, `getSourceRevision`, `search`, `addRelation` | `knowledge.sourceRevisionAdded.v1`, `knowledge.resourceDeleted.v1` |
| Study | `createPromptDraft`, `approvePrompt`, `startSession`, `recordAttempt`, `recordAssessment`, `saveCheckpoint` | `study.promptChanged.v1`, `study.sessionStarted.v1`, `study.attemptRecorded.v1`, `study.assessmentRecorded.v1`, `study.sessionEnded.v1` |
| Reviews | `enrollPrompt`, `listDue`, `pauseEnrollment`, `getReviewSummary` | `reviews.scheduleChanged.v1` |
| Exams | `createBlueprint`, `startPractice`, `assessPractice`, `getCoverage` | `exams.practiceAssessed.v1` |
| Japanese | `setSkillTarget`, `startPractice`, `assessSkillEvidence` | `japanese.skillEvidenceChanged.v1` |
| Home | `listDevices`, `setDeviceState`, `applyScene`, `getOperation` | `home.stateObserved.v1`, `home.commandUpdated.v1` |
| Home Alerts | `configureRule`, `acknowledgeAlert`, `listActiveAlerts` | `homeAlerts.alertOpened.v1` |
| Other life modules | Module-specific CRUD, summary queries and explicit reminder requests | Namespaced facts with IDs/revisions, not raw private journals |
| Automation | `saveRuleDraft`, `simulateRule`, `enableRule`, `pauseRule`, `getRun` | `automation.runFinished.v1` |

Methods shown are the initial contract vocabulary; the capability documents define behavior. An HTTP endpoint adapts one of these operations, rather than exposing repositories.

### HTTP conventions

- `/api/v1/{module}/...` routes are module-owned. Example: `POST /api/v1/tasks/{id}/complete`, `POST /api/v1/home/scenes/{id}/apply`.
- Authenticate before resolving object IDs. Validate request and response schemas. Apply body/file size limits and per-user operation limits.
- Mutations accept an `Idempotency-Key`; revision-sensitive updates carry `If-Match` or an equivalent explicit revision field. Reuse with a different payload returns conflict.
- Scope idempotency by actor, capability and operation; store a canonical payload hash and original result. Simultaneous identical requests resolve to one operation, including pending work.
- Return `200/201` for completed results; `202` for tracked background work; `409` for state/idempotency conflicts; `422` for validly encoded but invalid commands; `401/403` for access failures; `503` for temporary dependency failure. Do not return “success” with an unhandled failure inside arbitrary JSON.
- Errors include a stable code, user-readable message, correlation ID and retryability. Do not expose provider tokens or stack traces.
- Use cursor pagination and bounded time ranges. No endpoint returns an entire user library by default.
- Browser updates use an authenticated event stream carrying minimal resource invalidations or authorized status DTOs. After reconnect, refetch canonical state; the stream is not the browser’s durable database.

## Event envelope and reliability

```ts
type DomainEvent<T> = {
  eventId: string;
  type: string;                // e.g. study.attemptRecorded.v1
  schemaVersion: 1;
  occurredAt: string;           // UTC instant
  aggregate: ResourceRef;
  aggregateRevision: number;
  householdId: string;
  actorId: string;
  correlationId: string;
  causationId?: string;
  payload: T;
};

type AttemptRecorded = {
  attemptId: string;
  sessionId: string;
  promptId: string;
  promptRevision: number;
  activityKind: 'recall' | 'explanation' | 'problem' | 'communication';
  assessmentStatus: 'unassessed' | 'self' | 'reference' | 'reviewed';
  origin?: ResourceRef;        // an exam, language exercise or review enrollment
};
```

Do not broadcast the answer, transcript, source contents or private reflection. An authorized consumer queries the needed detail when handling the event. Jobs carry references wherever possible and recheck access; deletion or permission revocation can make an old event inapplicable.

Contract changes are additive within a version. Breaking payload changes get a new event/contract version and a migration/compatibility window. Since this is one release unit, update declared consumers together and keep old queued jobs/events readable until drained or migrated. Never “fix” a backlog by silently discarding unknown versions.

An event handler updates only its own module. Rebuild jobs use canonical snapshots plus a watermark; they must account for changes occurring during rebuilding. No consumer assumes event arrival order. Duplicate, stale and tombstone events are explicit test cases.

## Dependency direction

Static implementation imports remain confined to composition. The following is the intended *logical* public-interface dependency direction:

```text
Core + shared common contracts
    ↑ used by all

Tasks       Knowledge       Home       Independent personal records
  ↑            ↑              ↑
Goals       Study           Home Alerts
Calendar      ↑
Household   Reviews / Exams / Japanese
Habits      Connections → Knowledge
Training → Calendar + Tasks (only for explicitly requested links)
Relationships / Finance → Tasks or Calendar (reminder commands)

Capture → Tasks + Knowledge
Capacity → Tasks + Calendar
Reflection → read-only summaries from enabled modules
Briefings → Calendar + selected feeds + Knowledge references
Today → registered read-only contributions
Conversations + Usage → foundational history stores, no Assistant dependency
Memory → Conversations + Usage; other feature evidence via asynchronous ingestion
Evolution → Memory + Usage + read-only evaluation summaries
Assistant → Conversations + Memory + registered read tools + constrained action tools
Voice → Capture + Home + optionally Assistant
Automation → registered events/queries/commands; never an Assistant dependency
```

An arrow means “uses the public contract of,” not “owns.” Study does not query Reviews/Exams/Japanese to process an attempt. Those consumers interpret Study events with an `origin` reference. Tasks does not query Goals or Calendar to complete an occurrence. Home does not query Automation to change a device.

Read-only contribution interfaces reduce coupling but do not excuse cycles. Consumers register adapters in composition. Domain-level consumers must still declare dependencies for integration testing and lifecycle ordering.

Memory candidate hydration uses an outer context-validation pipeline with owner read adapters, described in [F6](09-intelligence-and-evolution.md). Memory does not gain a reverse synchronous dependency on Study or Assistant to validate its evidence.

## Cross-capability workflows

### 1. Capture → task → goal → scheduled block

1. Capture saves the raw item immediately.
2. User chooses “Convert to task.” Capture records a conversion operation and calls Tasks with a stable key derived from that conversion ID.
3. Tasks creates one task and returns its reference. Capture stores the result and marks the item converted. If the response is lost, retry returns the same task.
4. The user explicitly links the task to a goal. Goals validates that it can read the task and stores the link in its own schema.
5. Calendar proposes a time block using task duration and current calendar data. It does not mutate the task.
6. On confirmation, Calendar creates its block and queues any external provider write. The UI shows internal saved state separately from provider sync state.
7. A later task completion event updates Goal/Today projections. Calendar may mark its association complete; it never deletes or reschedules the event implicitly.

No transaction spans Capture, Tasks, Goals and Calendar. A partially completed flow is resumable and visible. Each step can succeed independently without losing the original capture.

### 2. Source → prompt → practice → future review

1. Knowledge stores an uploaded source and queues extraction. The source remains visible as `processing` until extraction succeeds or fails.
2. Study reads an authorized immutable source revision and creates a prompt draft. AI generates a source-grounded draft as part of the intended experience; approval and revision are explicit application states.
3. User approves the prompt/reference answer. Study records an immutable prompt revision with source locations.
4. Study starts a session with exact prompt revision snapshots. Submitted attempts append once, including assessment provenance.
5. Study publishes `attemptRecorded`; a later assessment publishes `assessmentRecorded` with its assessment ID, attempt reference and provenance. Reviews, if enabled, reads the authorized assessment and applies its scheduler only when it is eligible for that enrollment. Exam/Japanese consumers update their own evidence views. The attempt and assessment events must not advance the same review twice.
6. Study saves an editable checkpoint. Today can later display a resume contribution.
7. If a source is corrected, Knowledge creates a revision and emits a fact. Study flags dependent prompts for review; existing attempts retain their historical revision without pretending it is current.

Spaced-review timing, exam grading and Japanese skill assessment are distinct interpretations. A single attempt can inform several views, but only one owner records the raw attempt.

### 3. Start study → apply a home scene

1. Study commits the session start and emits a fact with no source text.
2. If an enabled Automation rule matches, Automation creates a run, checks the actor’s granted Home scope and calls `Home.applyScene` with a run-step idempotency key.
3. Home returns a tracked operation. Home Assistant acknowledgement and observed device state update its result.
4. Automation records completed/partial/failed status; a lighting failure never rolls back a valid study session.
5. On session end, an explicitly configured rule may request restoration. Restore only devices whose observed revision still matches that rule’s last change; do not overwrite intervening manual changes.

Until I05 is chosen, a manual scene button supplies the same benefit without cross-domain rules. The Study module never embeds lighting code.

### 4. Exam/Japanese practice → shared Study engine

The specialized module owns the selected objective, prompt set, rubric and originating practice record. It requests a Study session with owned prompt IDs, supported activity types and its origin reference. Study owns prompts, submitted answers and attachment references. It does not contain an `if Japanese then ...` curriculum branch.

Exams/Japanese consume session facts and retrieve authorized attempts to calculate their projections. Their rubric versions and assessment results remain owned locally. If the consumer fails, answers stay saved and the specialized assessment shows `pending`. Retrying the assessment cannot duplicate attempts.

### 5. Assistant → proposed calendar change

```text
User question
  → authenticated Assistant request
  → scoped Tasks/Calendar reads
  → context-aware AI draft
  → schema validation + deterministic constraint check
  → persisted action proposal with exact inputs and revisions
  → user confirms the displayed change
  → reauthorize + revalidate versions, time zone and conflicts
  → Calendar command with proposal idempotency key
  → tracked provider operation
  → result shown with links to canonical records
```

Confirmation applies to one immutable proposal version. Editing it invalidates the previous confirmation. Expiration, changed permissions or changed calendar/task revisions require a new preview; never silently reinterpret “yes.”

### 6. Home observation → alert → notification

Home observes a state and records freshness. Home Alerts evaluates a configured threshold/persistence rule and creates one alert instance for the episode. It asks Notifications to deliver a short message with a safe route reference. Notification delivery does not own acknowledgement or clear the alert. Acknowledging Home Alerts updates Today via invalidation. Unknown sensor state does not satisfy a “completed” or “safe” predicate.

### 7. Source deletion → search and AI cleanup

Knowledge immediately denies reads for the deleted revision and publishes a tombstone. Search results exclude it before asynchronous cleanup completes. Study marks dependent prompts unusable for new sessions; personal historical notes can remain with a removed-source marker, subject to the deletion scope selected by the user. Connections, Assistant and Briefings invalidate copied source snippets and generated material derived from that source according to the deletion policy. Jobs recheck source availability before writing their result, preventing resurrection after deletion.

## AI responsibilities and data exposure

AI is a foundational product dependency. Direct controls and recoverable records support reliability; equivalent non-AI functionality is not required for each feature. Core provides `AiGateway.generate`, `embed`, and a provider capability description. Speech transcription uses a similarly policy-controlled adapter. Business callers supply a purpose, allowed context, output schema, budget ceiling and cancellation signal.

| Calling module / task | Minimum context sent | Output and permitted effect | Recovery / direct control |
| --- | --- | --- | --- |
| Capture / classify a capture | Selected captured text; allowed destination kinds | Suggested type/title; user accepts conversion | Choose destination manually |
| Goals / break down an outcome | Selected goal and stated constraints | Draft milestones/tasks only | Manual goal editor |
| Knowledge / aid organization | Selected source excerpts and note context | Suggested summary/tags, preserved as generated drafts | Notes and full-text search |
| Study / prompts and tutoring | Authorized source chunks, prompt, current answer | Draft prompt, hint or feedback with cited source locations | User-authored prompt/reference and manual assessment |
| Exams / suggested marking | Specific answer, rubric and reference revisions | Proposed assessment awaiting review where not mechanically verifiable | Deterministic/manual marking |
| Japanese / conversation feedback | Selected language prompt, answer/transcript, reliable reference | Suggested correction and explanation, clearly uncertain where needed | Reference audio/text and self/teacher review |
| Connections / related concepts | Authorized candidate note excerpts | Proposed relation plus evidence and analogy limits | Manually create relation |
| Reflection / weekly draft | Explicitly selected summaries and notes | Editable narrative, no automatic goal changes | Structured reflection questions |
| Briefings / condense selected items | Allowed feed content, minimal relevant agenda context | Bounded summary with source references | Ranked source cards |
| Assistant / answer and propose | Results from authorized, registered tools only | Answer or validated action proposal | Search, explicit forms and commands |
| Voice / transcribe | Audio from an intentional session | Transcript; routed command after permission checks | Text/touch input |

Training progression, task completion, review intervals, access checks, sensor thresholds, calendar conflict checks and automation execution are deterministic application responsibilities. AI may explain or draft; it is not their authority.

### AI request lifecycle

1. Authenticate and authorize the calling feature and referenced records.
2. Resolve a declared purpose and whether cloud disclosure is permitted for that data class. Default-deny unknown purposes; do not let a prompt request broader data access.
3. Assemble minimum context through owner queries. Include stable chunk/source revision IDs; do not give the model database credentials or unrestricted file/network tools.
4. Reserve usage against per-request and monthly ceilings. Enforce token/audio/file limits. Concurrent requests cannot overspend the same unreserved balance. Record estimated versus provider-reported usage and release unused reservations.
5. Call the configured provider with a bounded timeout, concurrency limit and cancellation. Avoid automatic duplicate billing after an ambiguous provider response; retry policy distinguishes pre-send failure from unknown completion.
6. Validate structured output, allowed IDs and citations. A model-generated citation must resolve to an authorized supplied source. Missing evidence produces an explicit limitation, not an invented reference.
7. Persist the interaction through Conversations: application-visible messages, rendered prompt/template references, supplied context revisions, output, tool references, provider/model identity, usage and review status. Keep capability-owned semantic results in their owner. Credentials are redacted; ordinary operational logs do not become the transcript store. Emit durable usage/outcome observations for Memory and Evolution.
8. Recheck record revisions and deletion state before saving or acting. Discard a stale job result or present it as stale for review.

Retrieval helps locate evidence; it does not prove an answer correct. Source documents, web pages, transcripts and imported notes may contain prompt injection. Treat them as untrusted data, and enforce tool permissions in ordinary server code outside the model.

### Action boundary

Each assistant/voice action tool declares input schema, required scope, read/write classification, confirmation policy, idempotency behavior and display formatter. A model cannot register new tools or choose a raw endpoint.

- Read-only answers use authorized read tools.
- Approved low-impact direct commands, such as a permitted named lighting scene or saving a capture, may execute when the explicit request and configured policy authorize them.
- External calendar changes, messages, financial actions and sensitive device actions require a concrete preview/confirmation. Financial transactions and outbound messaging are outside the initial capability scope even if a model proposes them.
- Automation runs only previously enabled, validated rules. It does not interpret a fresh AI-generated plan at execution time.

## Time, recurrence and revisions

Store instants in UTC, user/provider IANA time zones separately, and all-day dates as dates rather than midnight UTC. Preserve recurrence rules and provider occurrence IDs. Explicitly handle skipped/repeated local times during daylight-saving changes and single-instance versus series edits.

Tasks, scheduled blocks and workouts are separate records: a scheduled task is not completed by time passing, and a completed workout need not imply that an unrelated goal is achieved. A missed task occurrence stays distinct from the next occurrence; do not silently roll history forward.

Optimistic concurrency compares the expected revision before changing state. Provider operations preserve provider revision/etag when available. If a provider does not support conditional writes, refresh and detect conflicts as far as possible, and display ambiguous outcomes rather than promising atomic external consistency.

## Interface-level acceptance

- Repeating a command with the same idempotency key and payload returns the same result; changing the payload returns conflict.
- A consumer can fail and recover without losing the source change or applying a local effect twice.
- A deleted or newly unauthorized source is not exposed by search, AI context assembly, cached contributions or delayed jobs.
- A specialized learning module can be disabled while Study retains valid attempts and checkpoints.
- A failed Home/Calendar/AI provider does not prevent creating a task or reading local notes.
- No module needs another module’s table, domain entity, UI store or implementation import to complete these journeys.
