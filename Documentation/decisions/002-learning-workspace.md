# Learn authoring and persistence

Date: 6 September 2026

## Decision

Add an independently enabled `learn` capability for the current subject workspace and its manual authoring workflows. `KOMOREBI_ENABLED_MODULES=["learn"]` runs it with Core identity, transactions and persistence, without Tasks, Usage or Conversations. Registration and schema migration order are infrastructure concerns, not business dependencies.

This first increment stores one **bounded, typed authoring aggregate per owner** in `learn.learning_workspaces`, using a JSON document and a workspace revision. Its public contract enumerates subjects, source material, highlights, Artifacts, deck drafts, cards, quizzes and recorded manual practice. It is not a generic Core record store. Maximum serialized workspace size is 800 KB; collection and field limits are also validated. It is suitable for the initial personal workspace, not a large document library. Durable original-file retention and background extraction jobs will use Core Files in a later increment. Bounded synchronous text/PDF/HTML extraction is described in [source imports](003-source-reader-and-imports.md).

Every save is an atomic revision-checked, idempotent command. It validates relationships and source locations before committing. Concurrent writers receive a conflict rather than a last-write-wins overwrite. Browser saves serialize; uncertain responses retry the original payload/key before queued edits. The UI preserves unsaved work in the open tab and provides JSON export, reload and same-owner reauthentication. An unload warning protects unsaved server edits; offline editing does not yet provide a durable replay queue.

Existing browser learning remains separate under its original key. Connection loads the server workspace, which starts empty. Import is an explicit action available for an empty workspace. No demo records are inserted by the backend. Only the running timer and sound preference are stored in an owner-specific browser key when connected; completion history is in the workspace. Whole-workspace conflicts also apply to simultaneous study on different devices.

## Workflow semantics

- Sources store normalized text, an optional HTTP(S) reference URL and import-type/filename metadata. Website, file and text inputs are supported through the [source reader and import flow](003-source-reader-and-imports.md). Reference-only legacy sources retain their original links.
- Highlights store source ID, exact quote and UTF-16 start/end offsets. Repeated passages resolve to the selected occurrence. Sources are immutable once saved to preserve those locations; updated material gets a new source ID. Highlight-derived Artifacts retain their highlight ID when edited.
- Selecting Artifacts creates a saved deck draft with one answer per Artifact. Questions begin empty for the user to author. The preview supports editing both sides, removing cards, selecting the destination subject and changing the title/topic. Drafts do not enter Review. Publishing preserves the draft and adds the deck/cards exactly once using stable IDs.
- Selecting flashcards within a deck creates a quiz preview with fronts as questions and backs as reference answers. Creating a quiz copies these values and retains card IDs. It does not remove cards or change their review schedule. Submitting a quiz saves the answer/question snapshots before revealing references. These are self-checks, not automatic grading.
- Highlight records, review records, quiz attempts and focus completion history are append-only during ordinary saves. A separate revision-checked `DELETE /api/v1/learn/workspace` clears the owned aggregate; it does not delete the account. Core export includes Learn even when its routes are disabled. Audit/outbox retain content-free change metadata; idempotency records retain only input hashes and resulting revisions, not learning content.

## Boundaries and next steps

This is the persistence boundary for the current Learn authoring experience. The longer-term Knowledge, Study and Reviews interfaces in the specification remain the intended boundaries for extraction, source revisions, reusable prompts, assessment and scheduling. They are not declared implemented by saving this aggregate. Future extraction must preserve subject/source/Artifact/card IDs and provenance; subject Sessions must never be reinterpreted as Study practice sessions.

Before growing beyond the bounded workspace, introduce resource-level commands and pagination, move source content to versioned Knowledge resources, and extract study/review commands behind public ports. This avoids premature placeholder modules while making the current storage/concurrency limits explicit. AI question drafting, provider-backed generation, full original-document retention and automatic grading are subsequent features.
