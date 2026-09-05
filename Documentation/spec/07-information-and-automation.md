# F5 · Daily information and assistance

[Specification index](../SPEC.md)

Fundamental: expose useful information at the right depth and reduce repeated coordination. These modules consume the rest of the application through explicit interfaces; they do not become the core or alternate owners of other modules’ records.

## I01 · Assemble a bounded Today dashboard

Priority: Essential. Module: `today`. Route: `/today`.

**User behavior:** see the next commitments, chosen task/goal, learning continuation or due-review summary, home scene controls and actionable exceptions. Pin/reorder allowed sections and dismiss a suggestion for a defined period. Open the canonical page for detailed work.

**Owned data:** `dashboard_layout`, `pinned_reference`, `dismissal`, bounded `contribution_cache`. No task, session, note or device source of truth lives here.

**Contribution interface**

```ts
type TodayContribution = {
  key: string;                 // stable within producer/user
  producer: string;
  kind: 'commitment' | 'action' | 'learning' | 'home' | 'exception';
  title: string;
  summary?: string;
  resource: ResourceRef;
  route: string;               // validated registered application route
  observedAt: string;
  expiresAt?: string;
  freshness: 'current' | 'stale' | 'unknown';
  visibility: 'private' | 'display';
  priority: number;            // bounded recommendation, not global life score
};
```

Producer readers receive the authenticated context and bounded request. Today validates limits/routes and uses its own presentation ordering: urgent allowed exceptions, next fixed commitment, user-pinned items, then ordinary suggestions. Default to at most six cards, with per-kind limits. Display visibility is enforced by owner query authorization, not trusted solely from this field.

**Interfaces:** `getToday`, `updateLayout`, `pinReference`, `dismissContribution`; registered producer readers implement `readTodayContributions(context, range, limit)`. Interactive owner-supplied widgets call their own capability APIs. Today never issues raw provider commands or writes producer records.

**AI:** uses relevant memory and prior interaction outcomes to rank/explain suitable contributions. Hard visibility, expiry and card-count rules are enforced in code. Persist presentation and response observations so ignored, opened, accepted and completed items are distinguishable.

**Failure behavior:** each producer has a short timeout; stale cached content is labeled and only used within its visibility/expiry rules. One failed producer does not blank the page. Clicking an outdated reference revalidates at the owner. Avoid a request fan-out per individual card by using bounded batch readers.

**Acceptance:** disable one capability and Today still renders; no more than the configured card limit appears; a display session cannot obtain private data by calling a contribution reader directly.

## I02 · Generate a sourced daily information briefing

Priority: Essential. Module: `briefings`. Routes: `/briefing`, `/briefing/sources`.

**User behavior:** choose information sources/interests and a digest size; view calendar context, relevant weather if configured, and a limited set of selected articles/updates. See source links, publication/observation dates and why an item appeared. Mute a source/topic and refresh deliberately.

**Owned data:** `feed_subscription`, `feed_item`, `briefing_snapshot`, `briefing_item`, `mute_rule`. Store only permitted feed excerpts/metadata and generated text; arbitrary full-content mirroring is not assumed.

**Interfaces:** source adapters fetch permitted feeds; Calendar provides a minimal agenda summary; Knowledge provides explicitly selected topic references. Today links to a briefing contribution. Reading a feed item can explicitly create a Capture item or Knowledge source import; it does not automatically enroll study material.

**AI:** synthesizes selected content using the user’s relevant interests, chat context and briefing feedback. Each factual item retains source/observation metadata and a clear distinction between fetched facts and generated synthesis. No infinite model-generated feed.

**Failure behavior:** bounded refresh jobs deduplicate by provider item ID or canonical URL/content identity. Provider failure leaves a dated previous briefing or “unavailable,” never a fabricated weather reading. A mute applies before generating another digest.

**Acceptance:** every briefing item has a source; item count stays within the user’s limit; AI failure leaves readable source cards; private calendar details do not appear on a display without authorization.

## I03 · Ask questions and preview application actions

Priority: Essential. Module: `assistant`. Route: `/assistant`.

**User behavior:** ask questions about authorized notes, study attempts, goals or commitments; inspect linked evidence; explicitly ask to draft a change. Review the exact proposed action and result. Conversations are persisted automatically across sessions; inspect, correct, archive or explicitly delete them.

**Owned data:** `retrieval_reference`, `assistant_run`, `action_proposal`, `action_execution`. Conversations owns canonical messages and tool/context references, exposed through shared contracts; Memory owns derived personal context. The proposal stores immutable tool name/version, validated arguments, rendered preview, required scopes, source revisions, expiry, confirmation identity and operation reference.

**Interfaces:** registered read tools and action tools only. No universal `runSQL`, `executeCode`, `fetchAnyURL`, `callAnyService` or raw database tool. A module opts into each tool with schemas and policy. Requests execute as the user/display principal with no privilege elevation.

**AI:** generates an evidence-linked answer or an action draft. Core AI Gateway handles provider/budget/disclosure policy. Assistant handles tool orchestration, bounded tool-call count and context selection using Conversations and Memory; it persists the interaction and its outcomes through their contracts. It cannot bypass an owner’s deterministic validation.

**Proposal lifecycle:** `draft → ready_for_review → confirmed → executing → completed`; exceptions `expired`, `superseded`, `failed`, `unknown_outcome`. Confirm an exact proposal version once. Recheck authorization, revisions and preconditions before execution. Calendar/Home operation tracking handles ambiguous provider effects.

**Failure behavior:** no evidence means an explicit limitation. A deleted source invalidates cached snippets. An AI timeout preserves the user message but no fictional result. Cancellation stops further tool calls; already committed actions remain tracked rather than described as rolled back. An interrupted confirmation cannot duplicate an action on retry.

**Acceptance:** answers cite accessible source locations; an attempted tool outside the registry is rejected; a changed calendar revision forces a refreshed preview; retries execute one approved action once at the owning boundary.

## I04 · Capture speech and route supported voice commands

Priority: Essential. Module: `voice`. Route: `/voice`, plus an optional push-to-talk shell control.

**User behavior:** intentionally begin a speech session, see/hear what was understood, and use supported actions such as creating a capture or applying a permitted scene. Correct ambiguous text before acting. Wake-word/always-listening operation is not the first slice.

**Owned data:** `voice_request`, `transcript_revision`, `routed_operation`. Core Files handles temporary audio; retention defaults to delete after transcription unless the user explicitly saves it.

**Interfaces:** transcription adapter followed by a constrained intent router. Deterministic supported commands call Capture/Home with the caller’s context; open-ended requests can be handed to Assistant when enabled. Transcription permission is not permission to execute an action.

**AI:** speech-to-text and optional intent interpretation. A low-confidence/ambiguous transcript requires correction; sensitive actions use the same preview/confirmation flow as text. A display’s microphone cannot acquire owner scopes.

**Failure behavior:** no microphone or model availability leaves touch/text controls usable. Requests use stable IDs across transcription retries. Temporary audio deletion runs after success, failure or expiration. No accidental recording outside an explicit session.

**Acceptance:** the same recorded request cannot add a capture twice; an unsupported command presents a limitation rather than improvising a service call; display sessions cannot retrieve private learning context through voice.

## I05 · Run explicit event-and-condition automation rules

Priority: Undecided. Module: `automation`. Routes: `/automations`, `/automations/:id`, `/automations/runs/:id`.

**User behavior:** choose a supported trigger, constrained conditions and allowed actions. Inspect a plain-language preview, simulate on sample/current data, enable, pause and review runs. Initial examples are a study-start scene and a weekly review notification; capability-specific recurring tasks remain in Tasks/Household.

**Owned data:** `rule`, immutable `rule_revision`, `rule_grant`, `automation_run`, `run_step`, `simulation_result`. A run records the trigger event ID, evaluated references/revisions, rule version and per-step result.

**Interfaces:** composition registers allowed trigger types, read predicates and command actions. Rules reference a finite typed registry; no embedded JavaScript, shell, arbitrary URLs or general expression language. Each action documents its idempotency and partial-failure behavior.

**Execution model**

1. Consume an eligible event or scheduled trigger; deduplicate `(rule_revision, trigger_identity)`.
2. Create a durable run and snapshot the matching rule.
3. Check enabled status, current grant and fresh condition inputs. Unknown condition data does not count as true.
4. Execute bounded steps through owner commands with `run_id + step_id` idempotency keys.
5. Record `completed | partial | failed | skipped | canceled` and allow inspection of what happened.

**AI:** may draft a rule in Assistant for editing. Saved rules execute deterministically; a model is not called to improvise actions during a run.

**Failure behavior:** enforce per-rule cooldown, maximum run frequency and causation-chain depth so events cannot loop indefinitely. Self-triggering cycles are rejected where detectable; runtime bounds cover indirect loops. Pausing prevents new runs and stops pending steps after their next cancellation check; it cannot undo an already applied external action. Destructive actions are excluded from the initial registry.

**Acceptance:** simulation performs no writes; duplicate trigger delivery starts one logical run; stale permissions stop an otherwise valid rule; a failed light action does not cancel or corrupt the originating Study session.

## Explicit limits of coordination modules

- Today and Briefings can summarize; they do not become writable copies of the source records.
- Assistant and Voice route actions; authorization and business validation remain at the owner.
- Automation is an optional business capability. Core Jobs is execution infrastructure, not the automation product.
- Integration adapters remain with the capability that understands them. A new briefing source should not require editing Home, Study or Tasks.
