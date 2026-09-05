# F1 · Planning and commitments

[Specification index](../SPEC.md)

Fundamental: capture intentions, choose meaningful outcomes and organize commitments into feasible next actions. Planning must distinguish a task from a goal, a calendar event and a suggestion.

## P01 · Capture items and convert them into tasks or notes

Priority: Essential. Module: `capture`. Routes: `/capture`, `/capture/:id`.

**User behavior**

- Save text, a URL or a file reference into one inbox without requiring a category or deadline.
- View unprocessed items, edit the original, archive it, or choose a destination: task, concept note or source import.
- Preview extracted title/content before conversion. Show the resulting record link and preserve the original capture until deliberately deleted.
- Optional voice input enters through Voice’s public capture command, with transcript provenance.

**Owned data:** `capture_item(id, user_id, body, attachment_refs, origin, state, revision)` and `conversion_operation(id, capture_id, destination_kind, status, result_ref, error)`.

**Interfaces:** `captureItem`, `updateCapture`, `convertToTask`, `convertToNote`, `importCapturedSource`, `listInbox`. Conversion uses Tasks/Knowledge public commands; a conversion ID supplies the downstream idempotency key. Capture never inserts another module’s rows.

**AI:** interprets captured text, suggests destinations and extracts candidate actions using relevant existing context. Persist the suggestion, edits and accepted/rejected result. Conversion follows the configured action policy; direct editing remains available.

**Failure behavior:** the capture remains saved if conversion fails. An interrupted conversion is `pending` or `failed`, with retry and inspection of the existing result. A duplicate response cannot create a second destination record. File-processing failure does not destroy the captured reference.

**Acceptance**

1. Save an unclassified item, close the page and find it again.
2. Retry the same conversion after a lost response; exactly one task/note exists.
3. Save AI suggestions and user corrections; an interrupted model request leaves the capture available for retry.

## P02 · Define goals, milestones and linked next actions

Priority: Essential. Module: `goals`. Routes: `/goals`, `/goals/:id`.

**User behavior**

- Create a goal with a purpose, desired outcome, optional target date, status and evidence definition.
- Add ordered milestones and links to Tasks-owned next actions. A goal can also link to a learning skill, exam or workout record as evidence without owning those records.
- Show “no next action selected,” “waiting,” “paused” or “completed” explicitly. Exploration can remain undated.
- Distinguish automatically collected evidence from the user’s declaration that the outcome is achieved. Completing linked tasks does not automatically prove the goal is achieved.

**Owned data:** `goal`, `milestone`, `goal_task_link`, `evidence_link`, optional `goal_reflection`. Goal status: `active | paused | achieved | archived`. Evidence links contain typed resource references and an explanatory note, not copied private records.

**Interfaces:** `createGoal`, `updateGoal`, `addMilestone`, `linkTask`, `linkEvidence`, `setGoalStatus`, `getGoalSummary`. Queries Tasks for task references; consumes task completion/deletion facts for its projection. Other evidence adapters are optional registered readers.

**AI:** develops milestones and next actions using the selected goal, constraints and relevant persistent context. Store suggestions separately until accepted. Accepting a suggested task issues `Tasks.createTask`, then links the returned reference.

**Failure behavior:** a missing/deleted action appears as an unavailable link; it does not delete the goal. A failed task-creation step is resumable. Stale evidence carries its last refresh time.

**Acceptance**

1. An undated goal can be active without generating overdue work.
2. Completing a linked task updates the displayed action status but leaves the goal’s achievement decision unchanged.
3. A goal with a deleted evidence record remains readable with a removed-reference marker.

## P03 · Manage tasks, recurrence and completion

Priority: Essential prerequisite. Module: `tasks`. Routes: `/tasks`, `/tasks/:id`.

**User behavior**

- Create tasks with title, description, status, optional deadline, estimated duration, effort label and context.
- Filter by status, due date or context; explicitly prioritize a task. View completed history.
- Create recurring task series and handle individual occurrences separately. Editing one occurrence does not edit the whole series without an explicit choice.
- Mark an occurrence complete, reopen it or cancel it. Recurrence does not reinterpret a missed occurrence as completed.

**Owned data:** `task`, `task_series`, `task_occurrence`, `task_change`. Store an optional opaque `origin_ref` for a maintenance template, habit or other requesting module. Tasks owns execution state; Goals owns goal links. Status: `open | in_progress | completed | canceled`, plus independent archival metadata.

**Interfaces:** `createTask`, `updateTask`, `createRecurringSeries`, `completeOccurrence`, `reopenOccurrence`, `listActionCandidates`, `getTask`, `getActivitySummary`. Completing a task publishes a minimal occurrence fact. Tasks does not call Goals, Calendar or Household.

**AI:** none required. Other modules can submit accepted task drafts through the normal command contract.

**Failure behavior:** revision conflicts prevent overwriting a newer edit. Recurrence generation uses a unique `(series_id, occurrence_key)` constraint and a bounded look-ahead window. Offline completion is not shown as server-saved until acknowledged; baseline offline mutation support is limited to local capture drafts.

**Acceptance**

1. Repeating a completion request records one completion event.
2. Canceling one recurring occurrence leaves later occurrences intact.
3. A task remains fully usable when Goals, Calendar and Household are disabled.

## P04 · View calendar events and schedule task blocks

Priority: Essential. Module: `calendar`. Routes: `/calendar`, `/calendar/connections`.

**User behavior**

- View day/week agenda with provider calendars and internal task blocks clearly identified.
- Create an internal block linked to a task, including planned start/end and time zone.
- Preview conflicts and changes before an external write. Fixed provider commitments are not automatically moved to make room for flexible work.
- Choose whether edits affect one recurring occurrence or the series. Display connection freshness, pending operations and conflicts.
- Read-only connection is the first provider slice; internal blocks are useful before provider writes exist.

**Owned data:** `calendar_connection` with credential reference, `provider_event_mirror`, `provider_occurrence`, `scheduled_block`, `provider_operation`, `sync_cursor`. Preserve provider IDs, etags/revisions, original time zones and recurrence identities.

**Interfaces:** `listAgenda(range)`, `proposeBlock(taskRef, interval)`, `confirmBlock(proposalId)`, `moveBlock`, `cancelBlock`, `getOperation`, `refreshConnection`. Task existence and authorized summary are read through Tasks. Calendar is the sole owner of event-provider adapters.

**AI:** may help interpret a natural-language request or draft alternatives in Assistant/Capacity. Calendar independently validates duration, revision, time zone, scope and conflicts. Scheduling correctness never depends on model output.

**External write lifecycle:** `proposed → confirmed → queued → sending → synced`; exceptions include `conflict`, `failed`, `unknown_outcome` and `canceled`. A provider timeout after sending enters reconciliation; use a provider idempotency token when available or a stable correlation marker/query before retrying. Never assume a timeout means no event was created.

**Sync ownership:** provider events are authoritative for their external fields. Internal task blocks are authoritative for their task association and local planning state. Do not overwrite provider edits during sync. A conflicting association remains visible for user resolution.

**Failure behavior:** retain internal blocks when a provider is unavailable and label the mirror stale. Conflicts require resolution; ambiguous writes require reconciliation. Expired credentials pause sync and request reconnection without deleting local records.

**Acceptance**

1. A task can be scheduled without becoming completed when the block ends.
2. A provider event edited elsewhere is refreshed or flagged as conflict rather than overwritten silently.
3. All-day dates and recurring local-time events render correctly across daylight-saving transitions.
4. A repeated external write after an ambiguous response does not knowingly create a duplicate; unreconciled outcomes stay explicit.

## P05 · Suggest tasks that fit available time and energy

Priority: Undecided. Module: `capacity`. Route: `/plan` or an optional Today panel.

**User behavior:** choose available minutes, an optional effort preference and whether to include learning or admin. Receive a bounded set of candidates with durations and selection reasons. Accept a candidate, ask Calendar for a proposed block, or dismiss it. Leave unscheduled capacity visible rather than filling every minute.

**Owned data:** `planning_session`, temporary `candidate_snapshot`, `decision`. Time/effort preferences are user-reported, not inferred health data.

**Interfaces:** reads Tasks’ bounded candidates, Calendar’s availability and optional Study/Reviews contribution summaries. Selection is deterministic initially: exclude blocked/completed items, fit the time budget with buffers, then order by explicit priority/deadline and stable tie-breaking. Any AI explanation uses the same selected candidates and cannot add hidden commitments.

**AI:** personalized explanation and ordering within the validated candidate set, informed by relevant usage and stated preferences. Deterministic time/conflict checks run after any suggestion; manual selection and the ordinary ranking remain available.

**Failure behavior:** stale calendar data prevents claiming a slot is conflict-free. A candidate is revalidated on acceptance. Declining an option does not add work to tomorrow. Missing durations prompt a user estimate or exclude the item from strict-fit planning.

**Acceptance:** the proposed total never exceeds the declared time budget; accepting after a conflicting edit triggers a refreshed proposal; disabling Capacity does not affect Tasks or Calendar.
