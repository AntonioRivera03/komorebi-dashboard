# F2 · Learning and knowledge

[Specification index](../SPEC.md)

Fundamental: preserve sources and understanding, practise retrieval/application and return to knowledge over time. Knowledge stores what the material says and what you wrote; Study stores what you attempted; specialized modules interpret those attempts for their own objectives.

## L01 · Import study sources with traceable locations

Priority: Essential. Module: `knowledge`. Routes: `/learn/library`, `/learn/library/:sourceId`.

**User behavior**

- Add a URL, a text/Markdown note or an uploaded text-based PDF as the first supported formats. Show unsupported/encrypted/scanned-file limitations explicitly; OCR and video transcription are later adapters.
- Preserve the original source and metadata: title, author when supplied, URL/file, import time and extraction status.
- Navigate to source passages using stable page, section or character-range references. Display generated extraction separately from the original.
- Replace or re-extract a source by creating a new immutable revision, not overwriting the version used by old attempts.

**Owned data:** `source`, `source_revision`, `source_chunk`, `extraction_job_ref`, `source_access`. Core Files owns bytes/metadata; Knowledge owns the semantic source, revision and locations. Each chunk belongs to a source revision and contains its locator, content hash and extraction method/version.

**Interfaces:** `importSource`, `getSourceRevision`, `getSourceChunks`, `listSources`, `reextractSource`, `deleteSource`. Authorized content is returned only through these queries. An identical file hash can prompt reuse; it must not reveal another user’s source or share authorization implicitly.

**AI:** enriches imported sources with generated summaries, topic suggestions and searchable semantic context while preserving the original. Ordinary text extraction remains a separate processing operation. Source embedding, if added, uses the same disclosure policy as text generation.

**Failure behavior:** states `queued | extracting | ready | partial | failed`. Extraction limits, malformed documents and inaccessible URLs retain the original with an error. The server URL fetcher rejects unapproved schemes, private network targets and redirect/DNS-resolution bypasses; Home Assistant configuration is a distinct integration path.

**Acceptance:** imported passages can be traced back to an original location; failed extraction remains retryable; revised sources preserve old references while making their superseded status clear.

## L02 · Write, link and search concept notes

Priority: Essential. Module: `knowledge`. Routes: `/learn/notes`, `/learn/notes/:id`, `/learn/library/search`.

**User behavior**

- Write explanations in your own words, attach source references, mark unanswered questions and tag notes with topics.
- Link two notes with a typed relationship such as prerequisite, example, contrast or related idea. Describe why the relationship exists.
- Search titles, note text and permitted extracted source content. Filter by topic, source and status; see excerpts and locations with results.
- Revise notes while preserving useful history. Archive differs from delete.

**Owned data:** `concept_note`, `note_revision`, `note_source_link`, `topic`, `note_topic`, `note_relation`. Search indexes are internal derived structures, not public tables.

**Interfaces:** `createNote`, `reviseNote`, `linkSource`, `addRelation`, `search(query, scope, cursor)`, `getAuthorizedContext`. Return record references, excerpts, provenance and access-safe route information. Connections/Assistant consume this contract without selecting their own SQL.

**AI:** generates contextual summaries, tags and explanations, with source links and revision history. Combine lexical and semantic retrieval; test relevance and deletion/access filtering on a representative corpus.

**Failure behavior:** sanitization prevents stored active content. Deleted sources become redacted references; revoked content disappears from search immediately. A stale vector index must never bypass authorization on final result hydration.

**Acceptance:** generated note enrichment preserves source provenance and user edits; a search result exposes its source; an unauthorized or deleted note cannot reappear through search, backlinks or AI context queries.

## L03 · Run study sessions and record practice attempts

Priority: Essential. Module: `study`. Routes: `/learn/sessions`, `/learn/sessions/:id`.

**User behavior**

- Choose source material and a practice format: recall, explanation, problem solving or communication.
- Create or review prompt drafts and reference answers before adding them to normal practice. Start a session with a selected set of approved prompts.
- Read/watch externally or in the source viewer, answer before revealing feedback, record a self-assessment or reference-based result, and save the session.
- Distinguish hint-assisted, reference-assisted and independent attempts. Preserve original answers; later corrections append a new assessment or attempt revision.

**Owned data:** `prompt`, immutable `prompt_revision`, `session`, `session_item`, `attempt`, `assessment`, `attempt_attachment`. Each session item pins prompt/source revisions. Each assessment records `self | deterministic | ai_draft | human_reviewed`, rubric/reference version and timestamp.

**Interfaces:** `createPromptDraft`, `approvePrompt`, `startSession(promptRefs, activityKind, originRef)`, `recordAttempt`, `recordAssessment`, `endSession`, `getAttempts`. Study reads Knowledge; it has no runtime dependency on Reviews, Exams or Japanese. Supported activity types are an explicit Study contract, not a dynamic plugin language.

**AI:** can draft prompts, ask follow-ups, suggest hints and compare an answer to supplied reference material. Require source locations for source-based claims. AI feedback remains a suggestion unless the user reviews it; deterministic grading is limited to formats with an unambiguous defined answer.

**Failure behavior:** save the answer before requesting feedback. Failed/canceled AI work cannot erase it. A duplicate submission key cannot create two attempts. A session can pause/resume without resetting its stored state. For exams, server deadlines are authoritative; the browser timer is only display.

**Acceptance:** an answer survives a failed model request and page refresh; an attempt pins the prompt version used; a new study session remains possible with all specialized learning modules disabled.

## L04 · Schedule spaced reviews from attempt history

Priority: Interested. Module: `reviews`. Route: `/learn/review`.

**User behavior:** explicitly enroll approved prompts, view due items, choose a review workload/new-item cap, pause a topic and resume it. Start a review session using Study. Show why an item is due and make workload/retention tradeoffs visible.

**Owned data:** `review_enrollment`, `schedule_state`, `review_transition`, `scheduler_profile`. Store algorithm name/version, input attempt IDs, rating mapping and prior state so transitions can be inspected and replayed under the same version.

**Interfaces:** reads approved prompt versions and eligible assessments through Study. Consumes `study.attemptRecorded.v1` and `study.assessmentRecorded.v1`, and issues `Study.startSession` for selected prompt IDs. Each `(enrollment_id, assessment_id, scheduler_version)` applies at most once across both event paths. Unassessed/AI-draft outcomes cannot silently update retention estimates. A correction replaces the effective assessment for that attempt and triggers a deterministic replay from the affected transition; it is not treated as another practice attempt.

**Algorithm decision:** select a maintained deterministic scheduler or an existing review-tool integration during this slice. FSRS is a candidate, not a newly invented model. Specify the exact rating mapping, migration behavior and supported attempt formats before enabling scheduling. Free-response/exam results do not automatically map to flashcard ratings.

**AI:** never chooses the next review interval. It may help repair a confusing prompt as a new draft revision.

**Failure behavior:** duplicate/out-of-order events reconcile from attempt history. Prompt deletion or a flagged invalid revision suspends enrollment. Pausing does not fabricate successful recall or reset history. Algorithm changes require a deliberate migration and reversible comparison.

**Acceptance:** the same ordered assessments yield the same schedule; retries do not advance it twice; a workload cap changes the displayed session without pretending overdue items were learned.

Reference: [Anki FSRS documentation](https://docs.ankiweb.net/deck-options.html#fsrs) describes scheduler configuration and retention/workload tradeoffs. It does not define this integration’s contract.

## L05 · Build exam plans and grade practice attempts

Priority: Essential. Module: `exams`. Routes: `/learn/exams`, `/learn/exams/:id`.

**User behavior**

- Enter exam date, format, syllabus topics, relative weights and approved reference/marking material.
- Link topics to sources and Study prompts. Distinguish coverage from demonstrated performance.
- Start a practice set, optionally timed, with a stable selection of prompt revisions. View submitted answers, rubric feedback and an error log.
- Turn a mistake into an explicitly accepted repair activity, prompt draft or task; then test using a fresh attempt.

**Owned data:** `exam`, `syllabus_topic`, `blueprint_revision`, `practice_run`, `rubric_revision`, `practice_assessment`, `error_log_entry`. Study owns prompt/answer records; Exams owns exam-specific interpretation and weighting.

**Interfaces:** queries Knowledge for material, requests Study sessions, reads attempts, optionally requests Calendar preparation blocks and Tasks repair actions. A practice run stores its Study session reference and blueprint/rubric versions. `assessPractice` may remain pending until all required attempts/assessments exist.

**AI:** drafts questions through Study and suggests rubric-based marking. It must quote/reference the relevant supplied criterion and separate uncertainty. Manual or deterministic review is required before presenting an AI grade as a reviewed result. No promised final exam score.

**Failure behavior:** timed session expiry preserves already submitted answers; late submissions follow the selected exam policy rather than client-clock time. Missing rubrics permit practice but not a fabricated score. Reassessment versions results instead of overwriting history.

**Acceptance:** practice scores can be traced to specific rubric/answer versions; a pending marking job does not lose answers; topic coverage and practice accuracy are displayed as distinct measures.

## L06 · Practise Japanese communication skills

Priority: Essential. Module: `japanese`. Routes: `/learn/japanese`, `/learn/japanese/skills/:id`.

**User behavior**

- Choose a purpose and starting level, then define practical targets such as introducing yourself, reading a menu or understanding a short exchange.
- Link trusted lesson/reference material. Practise listening comprehension, reading, written responses and optionally recorded speech.
- Start a Study communication session and save attempts with the level of assistance used.
- Review corrections and distinguish vocabulary recall from communication evidence. Goals may link an assessed skill, but a word count never automatically declares fluency.

**Owned data:** `language_profile`, `skill_target`, `lesson_mapping`, `skill_assessment`, `practice_origin`. Study owns generic prompts, attempts and their attachment references. Core Files stores explicitly saved audio bytes; Japanese owns curriculum and skill interpretation.

**Interfaces:** Knowledge source/context queries, Study prompt/session/attempt APIs, optional transcription via the policy-controlled speech adapter. Reviews enrollment is an explicit user action through its contract; a returned learning resource does not automatically create hundreds of cards.

**AI:** personalized role-play and feedback constrained by the selected level and reference. Pronunciation feedback requires a speech-capable evaluation approach and evidence; text transcription alone is not a pronunciation score. Generated dialogues/corrections are marked accordingly.

**Failure behavior:** permission denial for a microphone leaves text/reference practice usable. Transcription failure preserves explicitly saved audio with retry. Missing curriculum content results in an empty setup view rather than an invented course.

**Acceptance:** a target’s progress links to real attempts and assistance level; speech has an explicit provider dependency and text practice retains the same history; Study can be reused without importing Japanese curriculum rules.

Reference: [Japan Foundation Irodori](https://www.irodori.jpf.go.jp/en/about.html) is an optional source for practical communication objectives, subject to the user’s goals and content permissions.

## L07 · Save and resume a learning checkpoint

Priority: Essential. Module: `study`. Routes: `/learn/resume`, a checkpoint panel within a Study session.

**User behavior:** end or pause a session with a short record of what is understood, what remains unclear, the source location and the next useful step. Resume restores those references and offers a fresh session; pausing an interest does not create overdue work.

**Owned data:** `checkpoint(id, user_id, session_id, topic_ref, understood, open_question, next_step, source_refs, status, revision)`. Source locations remain references, not silent copies of full documents.

**Interfaces:** `saveCheckpoint`, `listResumeCandidates`, `resolveCheckpoint`, `resumeFromCheckpoint`. Today reads a short contribution, not the full private narrative on a display session.

**AI:** creates a checkpoint from the session’s notes, dialogue and attempts, preserving the open question and next step. Persist the generated version and user edits so future resumption uses the corrected context.

**Failure behavior:** unavailable/deleted material appears as a broken source reference while the user’s checkpoint remains accessible. A resumed checkpoint does not overwrite the original session.

**Acceptance:** return after a page/session restart to the same source location and question; retain the checkpoint and its conversation context across sessions; paused checkpoints do not enter task-overdue counts.

## L08 · Suggest evidence-linked connections between notes

Priority: Essential. Module: `connections`. Route: `/learn/connections`.

**User behavior:** request or opt into a small number of suggested relationships between existing notes. Inspect the two notes, proposed relation, supporting passages and limitations. Accept, edit or dismiss; accepted relations appear in Knowledge’s normal note view.

**Owned data:** `connection_candidate`, `suggestion_run`, `candidate_decision`, `promotion_operation`. A candidate pins both note revisions and contains evidence locations, proposed relation type and explanation. Knowledge owns the approved relation.

**Interfaces:** searches Knowledge for candidates, fetches authorized note revisions, then calls `Knowledge.addRelation` when approved. Promotion uses an idempotent operation so retry cannot add the same accepted relation twice. Dismissals prevent immediate re-suggestion for unchanged inputs.

**AI:** can propose semantic links/analogies using only the selected note excerpts. It must distinguish an analogy from a factual equivalence. Suggestions can use semantic retrieval and relevant learning history; persist acceptance, correction and dismissal as feedback.

**Failure behavior:** changed/deleted source notes invalidate the suggestion before approval. No useful candidates is a valid result. Model failure leaves the library and manual linking usable.

**Acceptance:** every suggestion resolves to authorized note revisions; approval creates a Knowledge-owned relationship exactly once; dismissal and stale-source checks survive refresh.
