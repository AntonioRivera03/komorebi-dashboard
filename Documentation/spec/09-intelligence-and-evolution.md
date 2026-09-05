# F6 · Persistent intelligence and application evolution

[Specification index](../SPEC.md) · Revision 2 addition

AI, connected capabilities and accumulated context are foundational to Komorebi. The application should remember conversations, understand how its features are used, preserve outcomes and corrections, and use that evidence to improve its assistance and its own design.

The user’s latest message ended mid-sentence. Durable history, usage auditing and persistent context are established requirements. Whether “evolve itself” also authorizes automatic behavior changes, code generation, merges or deployments remains open. This document defines the evidence and evaluation foundation without silently deciding that execution policy.

## Persistence model

Use the existing PostgreSQL database, with owned schemas rather than a second universal application database:

| Schema / owner | Durable records | Purpose |
| --- | --- | --- |
| `usage` | Interaction observations, workflow outcomes, feedback and aggregates | Understand what gets used and how |
| `conversations` | Threads, message revisions, context manifests, AI/tool run references | Preserve what was discussed and what the system did |
| `memory` | Evidence-linked facts, preferences, hypotheses and summaries | Retrieve useful personal context without rereading every record |
| `evolution` | Improvement candidates, evaluations, change records and observed results | Connect proposed improvements to evidence and measured outcomes |
| Existing capability schemas | Tasks, sources, attempts, calendar state, device operations, etc. | Remain authoritative for their business data |
| Core file store | Original files and retained media/payload artifacts | Store large objects under authorized file references |

Embeddings, search indexes and aggregates are derived from durable records. They do not replace transcripts, provenance or source records. Select the embedding provider and PostgreSQL-compatible vector storage implementation in the early memory slice; a separate vector service is not an architectural requirement.

“Store everything” means preserving meaningful application history and context, including selected provider data the application imports. Define capture coverage explicitly. It does not mean collecting passwords, hidden model reasoning, every keystroke or content from unrelated applications without a configured import. In-app chats persist automatically; external chat archives require a supported import/connection with provenance and deduplication.

## E01 · Record feature usage and workflow outcomes

Priority: Essential · latest correction. Module: `usage`. Route: `/history/usage`.

**User behavior:** inspect which capabilities are used, which workflows succeed, where they are abandoned or fail, which suggestions are accepted/edited/dismissed, and how AI usage/cost relates to useful outcomes. Filter by time, capability and workflow; open an underlying record when authorized.

**Owned data:** `interaction_observation`, `workflow_outcome`, `explicit_feedback`, `usage_aggregate`, `ingestion_receipt`. An observation includes:

- Stable event ID, schema version, actor/session, capability and action name.
- Occurred-at and received-at timestamps, correlation/causation IDs and workflow ID.
- Resource references, application release and relevant prompt/policy versions.
- Presentation/start/completion/cancellation/failure/acceptance/edit/dismissal event kind.
- Duration where measured, outcome/error category, and allowlisted properties.

**Interfaces:** `recordObservations`, `recordFeedback`, `queryUsage`, `getWorkflowHistory`. Core provides a neutral observation port; composition injects the Usage sink. Capability implementations do not import Usage implementation code. Server-confirmed changes record durable observations through the transactional outbox. Client interaction events use stable IDs and a bounded retry queue; they are not proof that a command committed.

**AI:** analyzes usage patterns and explicit feedback to identify friction, repeated setup and useful features. Statistical aggregations stay inspectable and provide denominators, time windows and collection coverage. A low use count does not automatically mean the feature lacks value.

**Failure behavior:** replayed observations deduplicate; out-of-order data uses event and receipt time. Client navigation/abandonment can be incompletely observed, so missing events are not fabricated. A delayed analytics consumer does not lose the owning module’s transaction or block all UI activity.

**Acceptance:** one retried command yields one recorded completion; a displayed suggestion, an accepted suggestion and completed work are distinguishable; periods with incomplete collection are labeled.

## E02 · Persist and retrieve conversations across features

Priority: Essential · latest correction. Module: `conversations`. Routes: `/conversations`, `/conversations/:id`.

**User behavior:** return to an assistant or study conversation with its original messages, context and action results. Search across authorized threads, continue one, correct a message, archive it or explicitly delete it. Feature pages link to the same canonical conversation record rather than maintaining incompatible private chat stores.

**Owned data:** `thread`, `message`, `message_revision`, `context_manifest`, `interaction_run`, `tool_run_reference`, `external_import_mapping`. Store message role, origin capability, timestamps, attachments, source links and completed/interrupted status. Preserve user-visible edits as revisions.

`interaction_run` records model/provider, prompt template/version, application-visible inputs and output, selected memory/source revisions, tool names/argument/result references, latency, usage, error and feedback. Store large authorized payloads as private artifacts. Redact credentials; never request or claim to store the provider’s hidden internal reasoning.

**Interfaces:** `createThread`, `appendMessage`, `reviseMessage`, `recordInteractionRun`, `listThreads`, `searchThreads`, `getThreadContext`, `deleteThread`. Assistant, Study and other feature AI callers use these contracts. Conversations does not call Assistant or Study to save a message; it accepts validated references and scoped content. External imports use source-provider/thread/message IDs to deduplicate.

**AI:** produces a versioned summary for retrieval/continuation while preserving full messages. Summarization cannot silently erase caveats or user corrections from the source record. Persist the input before an AI call and record the terminal run state afterward; checkpoint streaming output so interruptions are representable.

**Failure behavior:** stable client message IDs prevent duplicates after retries. Interrupted streaming is stored as incomplete, not a completed answer. Missing provider credentials yield a connection-needed run state with the original input saved. Chat history does not expire automatically after 24 hours.

**Acceptance:** resume a thread after restart; retrieve the exact user correction used in a later answer; distinguish tool proposal, execution and result; a failed model request retains the user input.

## E03 · Build evidence-linked personal memory

Priority: Essential · derived from persistent context. Module: `memory`. Route: `/memory`.

**User behavior:** inspect what the application remembers, why it believes it, when it last applied, and whether it came from an explicit statement or an inference. Correct, supersede or remove it. Experience assistance that uses relevant prior context across feature boundaries.

**Owned data:** `memory_item`, `memory_revision`, `memory_evidence_link`, `memory_conflict`, `retrieval_run`, derived embedding references. Each item includes type (`stated_fact`, `stated_preference`, `inferred_pattern`, `working_summary`), validity interval, status, source references, extractor version and review/confirmation provenance.

Examples: “prefers short study sessions on weekday evenings” with chat evidence; “often dismisses long sessions late at night” as an observed hypothesis with counts and time window. The latter must not silently become the former. An AI-generated claim does not become evidence merely because it appeared in a previous assistant reply.

**Interfaces:** `deriveMemory`, `retrieveRelevantContext`, `correctMemory`, `supersedeMemory`, `forgetMemory`, `getEvidence`. Memory consumes Conversations and Usage; other feature evidence arrives as versioned snapshots through ingestion adapters. It never edits source records or synchronously calls a feature that depends on Memory. AI callers receive bounded candidate context with evidence/revision references, not a dump of every conversation.

**AI:** extracts and consolidates candidate facts/preferences, resolves relevant context and summarizes patterns. Explicit user corrections take precedence over earlier inference. Retrieval considers purpose, authorization, relevance and temporal validity. Model confidence is labeled as a model assessment, not an objective probability of truth.

**Failure behavior:** conflicting evidence stays visible rather than silently overwriting a fact. Source deletion/revocation immediately makes dependent memory ineligible for retrieval, followed by rederivation/purge. Old extraction jobs recheck source revision/deletion state before commit. Forgetting an inference creates a suppression record so unchanged historical evidence does not instantly recreate it; later explicit statements can deliberately replace that decision.

**Acceptance:** a corrected preference changes future retrieval; every memory resolves to evidence; an assistant inference cannot recursively establish itself as fact; deleting a source invalidates derived memory and cached context.

## E04 · Evaluate and track application improvements

Priority: Essential direction; autonomous execution scope pending. Module: `evolution`. Routes: `/improvements`, `/improvements/:id`.

**User behavior:** inspect evidence of friction or opportunity, the proposed improvement, affected capabilities, evaluation results and subsequent outcomes. Separate improvements in personal assistance from changes to application behavior or source code.

**Owned data:** `improvement_candidate`, `evidence_bundle`, `evaluation_run`, `change_record`, `outcome_comparison`. A candidate includes the problem, supporting source/usage references, hypothesis, affected contracts, proposed change type, expected benefit, measurement criteria and rollback approach where relevant.

**Interfaces:** `analyzeUsage`, `createCandidate`, `evaluateCandidate`, `recordDecision`, `recordAppliedChange`, `compareOutcomes`. Reads scoped Usage/Memory summaries and references original evidence through authorized contracts. No cross-module code or database access is added to Core to support these operations.

**AI:** identifies repetitive work, synthesizes chat requests and proposes capability/UI/prompt improvements. It can prepare an implementation proposal with the relevant boundaries. The complete brief must determine which changes it may execute autonomously, how implementation agents run and how release approval works.

**Failure behavior:** insufficient data produces an unproven hypothesis, not a confident redesign. A behavior change is evaluated against usefulness and user corrections as well as engagement. A failed evaluation records its evidence; it does not silently broaden the acceptance threshold.

**Acceptance:** a candidate links to real observations or explicit chat requests; a later outcome can be compared with a declared baseline; a source-code or behavioral change is not treated as authorized merely because an AI suggested it.

## Learning and improvement flow

```text
Feature interaction / chat / action outcome
    → durable owner record + usage observation
    → Conversations and Usage history
    → evidence-linked Memory extraction
    → relevant context supplied to the next AI interaction
    → user response / correction / actual outcome
    → revised memory and evidence-backed improvement candidates
    → evaluation and change record
    → execution policy to be completed from the remaining brief
```

This is persistent context and application improvement, not an assumption of continual model-weight training. Fine-tuning or model training would be a separate technical choice with its own dataset/evaluation requirements.

## Isolation and shared interfaces

Contracts live in `shared/contracts/usage`, `conversations`, `memory` and `evolution`, each with its owning module. A shared chat presentation component may be promoted to `shared/ui` when Assistant and Study both use it; feature prompts and workflows stay local.

Keep dependencies directed: Conversations and Usage do not depend on Assistant; Memory reads those sources; Assistant/Study consume Memory; Evolution reads evidence. For Study/other feature feedback into Memory, publish source facts through a registered ingestion adapter in composition rather than adding a reverse synchronous dependency. Projection updates and memory extraction run asynchronously with version checks.

Before a candidate is exposed in the Memory UI or sent to a model, a shared context-validation interface checks current access, deletion and revision through owner-provided read adapters wired at composition. This orchestration is outside Memory: Memory returns candidate references, owners validate their own records, and only validated candidates are hydrated for the caller. A delayed deletion event therefore cannot expose a stale memory. The validator has no feature-specific inference logic; unavailable validation excludes the affected candidate until it can be checked.

Data retention is distinct from context transmission. Keeping history in the application database does not mean sending all history to each model request. Assemble purpose-specific context and record what was actually used. Large artifacts remain in the file store; partition/archive growing usage tables under an explicit policy rather than deleting product history through a generic log-retention job.

## Open point from the incomplete message

Complete the autonomous evolution design after the user clarifies whether it includes preference adaptation, proposed workflow changes, automatic configuration changes, code modifications, or releases. The current requirement supports designing the full evidence and persistence foundation now; it does not resolve those different execution authorities.
