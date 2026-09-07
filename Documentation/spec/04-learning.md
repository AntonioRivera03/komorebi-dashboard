# F2 · Learning and knowledge

[Specification index](../SPEC.md)

Fundamental: preserve sources and understanding, practise retrieval/application and return to knowledge over time. Knowledge stores what the material says and what you wrote; Study stores what you attempted; specialized modules interpret those attempts for their own objectives.

## Frontend rework · Sessions first

The Learn navigation is **Home · Sessions · Artifacts · Review**. `/learn` opens Home. A **Session** is a persistent subject or subject-topic workspace, such as Japanese or Cognitive psychology, rather than a single timed practice attempt. Selecting it opens `/learn/sessions/:id` with its Sources, Artifacts, Flashcards, Quizzes and Exams. These are local views within that subject; Japanese, Library, Resume, Exams and Connections are no longer independent top-level Learn tabs.

- **Interface copy:** omit decorative eyebrows, motivational captions and duplicate explanations. Keep actionable guidance, meaningful subject/topic labels, validation, and storage status. “Head to Review to study your decks” links directly to `/learn/review`.
- **Home:** one random flashcard with reveal/another-card actions, a compact activity count, and a titled Pomodoro. Revealing a Home card is casual recall and does not change review history or scheduling.
- **Sessions:** create a subject workspace, describe it briefly, then collect its material. A resource belongs to a Session. Topics are shared within that Session and can be selected or created while capturing an Artifact or authoring a card. Topic names in different Sessions do not imply shared ownership.
- **Artifacts:** replace the Notes tab with quick pieces of writing: thoughts, facts, questions and explanations. Capture with a Session and topic; edit or regroup later. The global page filters by Session and topic and groups the results by topic. Longer notes and provenance remain valid underlying Knowledge concepts.
- **Review:** deck-based SM-2 study, a Session filter, due-card counts and actual review history. No Interested badge, daily-cap slider, retention-target control or 14-day forecast. History shows completed ratings per local calendar day across 7, 30 or 90 days, including repeat attempts, with accessible daily counts. Empty history stays at zero; example data must never pretend the user has studied.
- **Decks:** create a named grouping, attach it to one Session and choose its default topic. Each card has its own topic, front and back. New cards default to the deck topic, with existing or newly entered topics available. Decks can be reassigned to a Session without resetting card schedules; historical reviews retain the Session recorded at review time.

**Current implementation:** the Learn authoring experience supports browser preview storage and an independently enabled `learn` backend. Its bounded typed workspace persists subject Sessions, text sources, exact highlights, Artifacts, deck drafts, flashcards, quizzes and manual practice history. See [learning persistence decision](../decisions/002-learning-workspace.md) for ownership, limits and the future Knowledge/Study extraction boundary. Existing source/exam detail screens and practice routes remain compatible.

**Source → Artifact:** Sources use a file list on the left and an inline reader in the center, with no source-card grid or reading popup. Add source opens a modal whose first dropdown is Website, File or Text. Websites extract cleaned readable text; files support UTF-8 text/Markdown/HTML and text-based PDFs. Processing locks the form and dismissal until completion; failures offer pasted text. Review the extracted text, then add the source. Select a passage in the reader and save a highlight or create an Artifact. Highlights preserve exact UTF-16 offsets and quotes; repeated text resolves to the selected occurrence. An Artifact retains the passage link when its body is edited. Sources already stored on the server are immutable; add a new source for revised text. See [source imports](../decisions/003-source-reader-and-imports.md) for request/parser bounds, URL validation and supported file limits. The app shell and Learn page fill the browser width; narrow screens stack the source list above the reader.

**Artifacts → deck draft → deck:** select one or more visible Artifacts, create a draft, author each question and review/edit its answer before publication. Artifacts initially populate the answer side; no AI generation is claimed. Remove unwanted cards and choose the destination subject/title/topic in the preview. Saved drafts appear in Artifacts and Flashcards/Review, stay out of review queues, and publish once with stable identifiers.

**Flashcards → quiz:** select one or more cards in an open deck, inspect questions/reference answers, name the quiz and create it in that deck's subject. Card fronts/backs are copied into a quiz snapshot without removing cards or modifying review schedules. Submissions retain answer and question snapshots before revealing references. Prior attempts are available in the quiz. Automatic grading and multiple-choice generation remain future work.

**Persistence and connection:** Core owner-ticket authentication protects Learn. The browser offers connection, explicit import of preview data into an empty server workspace, save/error status, JSON export, safe retry, same-owner reauthentication and explicit conflict reload. The backend validates all references and size limits, checks workspace revisions, and preserves original sources and recorded history. Unrelated capabilities can be disabled. The active timer remains local to each device; completed focus history persists with the workspace. There is no durable offline replay queue yet.

**Backend follow-up:** preserve subject identity separately from Study's practice `session`. Future Knowledge/Study/Reviews resource-level commands must preserve existing IDs and provenance. Durable original-file retention, OCR, richer exams, AI drafting and large-library pagination remain future work.

## L01 · Import study sources with traceable locations

Priority: Essential. Module: `knowledge`. Routes: `/learn/sessions/:id?section=Sources`, with existing detail `/learn/library/:sourceId` and legacy library `/learn/library`.

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

## L02 · Capture, group and connect Artifacts

Priority: Essential. Module: `knowledge`. Routes: `/learn/artifacts`, `/learn/sessions/:id?section=Artifacts`; legacy detail `/learn/notes/:id` and source search `/learn/library/search`.

**User behavior**

- Quickly capture a piece of information in your own words, associate it with a Session and select or create a topic. Group and filter Artifacts by topic; edit the writing or grouping later. Attach source references and mark unanswered questions when useful.
- Link two notes with a typed relationship such as prerequisite, example, contrast or related idea. Describe why the relationship exists.
- Search titles, note text and permitted extracted source content. Filter by topic, source and status; see excerpts and locations with results.
- Revise notes while preserving useful history. Archive differs from delete.

**Owned data:** `concept_note`, `note_revision`, `note_source_link`, `topic`, `note_topic`, `note_relation`. Search indexes are internal derived structures, not public tables.

**Interfaces:** `createNote`, `reviseNote`, `linkSource`, `addRelation`, `search(query, scope, cursor)`, `getAuthorizedContext`. Return record references, excerpts, provenance and access-safe route information. Connections/Assistant consume this contract without selecting their own SQL.

**AI:** generates contextual summaries, tags and explanations, with source links and revision history. Combine lexical and semantic retrieval; test relevance and deletion/access filtering on a representative corpus.

**Failure behavior:** sanitization prevents stored active content. Deleted sources become redacted references; revoked content disappears from search immediately. A stale vector index must never bypass authorization on final result hydration.

**Acceptance:** generated note enrichment preserves source provenance and user edits; a search result exposes its source; an unauthorized or deleted note cannot reappear through search, backlinks or AI context queries.

## L03 · Run study sessions and record practice attempts

Priority: Essential. Module: `study`. Routes: `/learn/practice/:id`, launched within a subject Session. The Study-owned `session` below is a practice run; the frontend Session is its persistent subject container.

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

Priority: Essential. Module: `reviews`. Route: `/learn/review`.

**User behavior:** create a deck, attach it to a Session, and author question/answer cards with existing or new topics. Open a deck to inspect or add cards. Review its due cards or all due cards in the selected Session without a daily cap. Reveal before rating; show remaining cards and record every rating. Cards rated below four return in the current round and remain due if the user finishes early. History plots completed reviews rather than future workload.

**Owned data (planned contract, no schema work in this pass):** `deck`, `deck_session_ref`, `card_topic_ref`, `review_enrollment`, `schedule_state`, `review_transition`, `scheduler_profile`. Store algorithm name/version, input attempt IDs, rating mapping and prior state so transitions can be inspected and replayed under the same version.

**Interfaces:** reads approved prompt versions and eligible assessments through Study. Consumes `study.attemptRecorded.v1` and `study.assessmentRecorded.v1`, and issues `Study.startSession` for selected prompt IDs. Each `(enrollment_id, assessment_id, scheduler_version)` applies at most once across both event paths. Unassessed/AI-draft outcomes cannot silently update retention estimates. A correction replaces the effective assessment for that attempt and triggers a deterministic replay from the affected transition; it is not treated as another practice attempt.

**Algorithm decision: SM-2, application scheduler version 1.** Each card starts with ease 2.5, zero successful repetitions and no interval. The six quality buttons map directly to grades 0–5: blank, recognized after reveal, incorrect but almost recalled, difficult correct recall, correct after hesitation, and immediate correct recall. Successful intervals begin at 1 and 6 days, then use the prior interval multiplied by the prior ease, rounded up. Update ease with `max(1.3, ease + 0.1 - (5-q) * (0.08 + (5-q) * 0.02))`; grades below 3 reset the successful-repetition count and interval to 0 and 1 respectively. Grades below 4 are repeated in the same round. In this implementation each such repetition receives its own rating and transition, and remains immediately due until a grade of at least 4. Advance due dates by local calendar days. Persist prior/next state, grade, card/deck/Session IDs and timestamp for replay. Production scheduling must use an explicit user timezone and an authoritative server clock. Quizzes, exams and casual Home reveals never implicitly grade flashcards.

No automatic FSRS-to-SM-2 conversion is introduced. A future backend integration must explicitly choose migration/reset behavior and preserve the previous schedule and review history before changing existing enrollments.

**AI:** never chooses the next review interval. It may help repair a confusing prompt as a new draft revision.

**Failure behavior:** duplicate/out-of-order events reconcile from attempt history. Prompt deletion or a flagged invalid revision suspends enrollment. Pausing does not fabricate successful recall or reset history. Algorithm changes require a deliberate migration and reversible comparison.

**Acceptance:** the same ordered ratings, timestamps and timezone yield the same schedule; retries do not advance it twice; unfinished/repeat cards stay due; history updates from real ratings; deck creation and topic selection work within the chosen Session.

Reference: [Original SuperMemo SM-2 algorithm](https://super-memory.org/archive/english/ol/sm2.htm). The application-specific replay, persistence and timezone requirements above define this integration’s contract.

## L05 · Build exam plans and grade practice attempts

Priority: Essential. Module: `exams`. Routes: `/learn/sessions/:id?section=Exams`, with existing details at `/learn/exams/:id`.

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

Priority: Essential. Module: `japanese`. Route: `/learn/sessions/japanese`. Japanese is a Session, not a separate Learn section. Language-specific capabilities below remain available for future integration within that space.

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

## L09 · Focus with a titled Pomodoro and completion audit

Priority: Essential. Module: `study`. Route: `/learn`.

**User behavior:** enter what you are studying, optionally choose its Session, and choose any positive whole-minute focus duration (25 minutes by default). The choice persists for subsequent focus periods, including across breaks, resets and refreshes. Start the configured focus period. Pause, resume or reset. At completion, hold the timer at `00:00` until the user presses **Finish**. Finish silences the alarm, plays a short upbeat celebration once, and resets to the chosen focus duration; there is no automatic transition into a break or another run. A 5-minute break can be selected explicitly while idle, and its completion also waits for Finish. Freeze the duration, study title and Session after starting so the completion record describes the original activity. Navigation or refresh must not reset a running timer. A suspended tab reconciles the saved deadline when it wakes. Paused time is excluded from focus duration.

**Target dedicated audit table (current completions persist as append-only workspace records):** `pomodoro_completion(id, user_id, timer_run_id, learning_session_id nullable, study_title, started_at, completed_at, planned_focus_seconds, focus_seconds, timezone, recorded_at)`. Require a unique `(user_id, timer_run_id)` key. Every completed focus period produces exactly one append-only row; pauses, resets before completion, skipped breaks and completed breaks produce none. Store both the configured target (`planned_focus_seconds`) and the actual active duration completed (`focus_seconds`) in seconds on every audit record; never assume a fixed 25 minutes. A naturally completed timer records its full configured duration. Record completion at the timer deadline, independently of when Finish is pressed. Waiting for acknowledgment and repeated jingles add no focused time or extra rows. Exclude paused time and delayed completion detection from active time; `completed_at - started_at` is wall-clock duration and must not be substituted for focused time. For example, a 42-minute timer paused for one minute records 2,520 focused seconds, even though 43 minutes elapsed. Sum recorded durations for daily totals. Store the scheduled completion timestamp when detection is delayed. Keep the title snapshot even if the Session is renamed. Retry after offline/reconnect with the same run ID. Audit history should be queryable by date and Session and shown in a table with title, Session, completion time and focus duration.

**Completion sound:** repeat the short, cheerful jingle in a native audio-buffer loop when focus or a break finishes, until the user presses Finish (or mutes sound). Finish must halt the currently playing phrase immediately, then play a distinct one-shot victory tune: a bright ascending phrase resolving to a major chord. This celebration respects the sound toggle, does not loop, and never plays for an early Reset, pause, or automatic timer expiration. Keep the alarm alive during navigation and show a compact Finish control outside Learn Home. Persist the finished state across refreshes; after audio is unlocked, an unacknowledged alarm resumes. Test sound remains a single preview, not a loop. Provide a persistent sound toggle and a Test sound action. Resets before the deadline and pause/resume must not trigger the jingle. Unlock audio from a user gesture; after refresh, sound requires browser audio permission from a subsequent interaction. Tab suspension can delay playback until the page wakes. Sound failure must never prevent completion or recording. See [Web Audio autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy).

**Frontend preview:** store the configured duration, timer deadline, remaining time, finished/awaiting-Finish state, title, optional Session and completion records in browser storage. Display a local Focus history table after the first completion. This is a local interaction preview, not a database audit or a promise of account/multi-device synchronization. Browser storage clearing removes the preview. Multiple simultaneous tabs/devices require a future authoritative completion service and reconciliation policy.

**Acceptance:** a newly started one-minute timer displays `01:00`, never `01:01`, even if the UI clock predates the click; Resume cannot add a display second; completion stays at zero and loops the alarm until Finish; Finish silences immediately and restores the configured focus duration; completing focus creates one local row; subsequent ticks/reload cannot duplicate it; completion detected after a long sleep uses the saved deadline; pausing/resuming preserves sub-second remaining focus time; custom durations survive breaks/resets/refresh; old browser records are upgraded as 25-minute runs without losing history; the displayed daily total sums each recorded duration; breaks and incomplete resets create no row. No database, migration or server changes are included in this frontend pass.
