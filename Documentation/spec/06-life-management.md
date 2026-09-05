# F4 · Personal routines and administration

[Specification index](../SPEC.md)

Fundamental: support health, ordinary obligations and meaningful experiences without creating a second job of record keeping. These modules extend the same task/calendar/knowledge contracts rather than creating parallel lists of commitments.

## M01 · Schedule a running plan and log sessions

Priority: Undecided. Module: `training`. Routes: `/life/training`, `/life/training/plans/:id`.

**User behavior:** enter a baseline, define a target such as a 5K or 10K, attach a chosen training plan, schedule selected sessions and log duration/distance plus optional effort and notes. Compare planned and completed sessions; explicitly adjust future sessions.

**Owned data:** `training_profile`, `training_plan`, `planned_workout`, `workout_log`, `activity_import_mapping`. Calendar owns time blocks; Tasks owns any explicitly requested preparation tasks. Training owns the plan and observed activity, not a duplicate task completion ledger.

**Interfaces:** `createPlan`, `scheduleWorkout`, `recordWorkout`, `reviseFuturePlan`, `getTrainingSummary`. Optional Goals evidence links and Calendar block references are logical references. Wearable/activity imports are optional adapters; manual records are first-class.

**AI:** no autonomous prescription, readiness scoring or mileage escalation. It may organize a user-selected plan or summarize logs with clear source context. Your September/Thanksgiving targets are inputs to configure, not a hardcoded deadline or inferred safe progression.

**Failure behavior:** an imported activity matches a stable provider ID and cannot duplicate a manual record without a reviewable reconciliation. A missed workout does not automatically increase another workout. Unknown baseline prevents presenting a personalized progression as validated.

**Acceptance:** log without a wearable; reschedule without losing the original plan/history; distinguish completion of an activity from achievement of a running goal.

## M02 · Track cue-based routines and fallback actions

Priority: Undecided. Module: `habits`. Route: `/life/habits`.

**User behavior:** define a cue, standard action, optional smaller action and intended cadence. Check in as completed, fallback used, skipped or resting. Pause/resume without losing history. Optional reminders respect chosen channels and quiet hours.

**Owned data:** `habit`, `habit_schedule`, `habit_checkin`, `habit_task_link`. Recurring actionable occurrences can be created through Tasks; Habits retains its meaning and check-in context. Avoid generating both a task and a habit reminder by default.

**Interfaces:** `createHabit`, `checkIn`, `pauseHabit`, `requestTaskSeries`, `getHabitSummary`. Consumes linked Tasks facts only when configured. A completed task can suggest a check-in but does not infer the user’s effort or emotional state.

**AI:** optional wording/fallback drafts. No model decides whether rest is legitimate or increases expectations automatically.

**Failure behavior:** local-time cadence honors the user’s time zone; duplicate check-ins use a stable period key. A late entry preserves its actual entry time and intended date. Pause stops future nudges.

**Acceptance:** rest does not appear as a failed streak; pausing stops reminders; optional task links do not create two independently editable schedules.

## M03 · Review weekly activity and record adjustments

Priority: Undecided. Module: `reflection`. Route: `/life/review`.

**User behavior:** choose a week, inspect sourced summaries and write what mattered, what was difficult and what to change. Accept a specific next adjustment such as pausing a goal or reducing an active routine. Store a narrative alongside numbers rather than reducing the week to a score.

**Owned data:** `reflection`, `reflection_snapshot_ref`, `adjustment_proposal`, `adjustment_operation`. Module summary snapshots include coverage/freshness so missing data is not interpreted as no activity.

**Interfaces:** reads bounded summary contracts from selected modules. Applies an accepted adjustment through its owner’s command with idempotency/revision checks; Reflection does not modify goals/habits/tasks directly.

**AI:** optional draft based only on selected summaries and notes. The user can omit an area, edit the draft or write manually. Generated interpretation is not evidence of mood, health or relationship quality.

**Failure behavior:** partial source availability is labeled; raw personal narrative stays private. A failed adjustment remains visible beside the saved reflection rather than losing both.

**Acceptance:** a week with unavailable data says so; review works with a manual template; one accepted adjustment updates one owning module exactly once.

## M04 · Keep personal dates and contact reminders

Priority: Undecided. Module: `relationships`. Route: `/life/people`.

**User behavior:** manually record a person, important dates, optional notes and a chosen reminder. Add an experience idea such as a trip or event. No relationship ranking or contact-frequency requirement is assumed.

**Owned data:** `person_note`, `personal_date`, `contact_reminder`, `experience_idea`. Keep sensitive notes separate from reminder summaries.

**Interfaces:** `savePersonNote`, `createDateReminder`, `createExperienceIdea`, `requestTask`, `requestCalendarBlock`. Calendar/Tasks receive only the user-approved title/date/details needed for that record.

**AI:** optional draft wording for a reminder or idea. Outbound messages are not part of this capability’s initial contract.

**Failure behavior:** reminder delivery does not imply contact occurred. Annual dates require an explicit leap-day handling policy. Deleted personal notes are excluded from shared-screen summaries and AI retrieval.

**Acceptance:** a reminder can exist without a contact import; no message is sent when completing it; private notes are not copied into calendar descriptions by default.

## M05 · Manage household shopping lists

Priority: Essential. Module: `household`. Routes: `/life/household/shopping`.

**User behavior:** create lists, add/edit items and quantities, mark purchased, restore an item, and optionally repeat a frequently used item. Voice/Capture can add an explicitly requested item via the Household command.

**Owned data:** `shopping_list`, `shopping_item`, `shopping_item_change`. This is a shopping domain record, not a generic task with overloaded status fields. Optional household scope supports a future second authorized user without requiring shared access initially.

**Interfaces:** `createList`, `addShoppingItem`, `setPurchased`, `listShoppingItems`. Optional completion summary for Today. No inventory prediction, purchasing API or financial transaction is required.

**AI:** optional parsing of a user-supplied list into previewable item/quantity drafts. Exact text entry is always available.

**Failure behavior:** concurrent edits use revisions; repeated voice/transcript delivery has one request identity. Items are not silently merged solely because their names are similar.

**Acceptance:** purchase/unpurchase survives refresh; replaying the same add-item command creates one item; disabling Tasks does not disable shopping.

## M06 · Schedule chores, maintenance and renewals

Priority: Essential. Module: `household`. Routes: `/life/household/maintenance`.

**User behavior:** define a recurring chore, device maintenance item or renewal with instructions, cadence and optional related room/device/document. Choose calendar-based recurrence or a next due date relative to the last completion. View pending occurrences and completion history.

**Owned data:** `maintenance_template`, `maintenance_task_link`, `maintenance_completion_projection`. Tasks owns generated occurrences and completion timestamps; Household owns cadence semantics, instructions and linked household assets.

**Interfaces:** `createMaintenanceTemplate`, `reviseTemplate`, `generateNextTask`, `getMaintenanceSummary`. Calendar-based schedules delegate recurrence to Tasks and store its series reference. Completion-relative schedules create one next task after consuming the prior completion, with a unique `(template_id, completed_occurrence_id)` generation key. Only one recurrence mechanism is active for a template.

**AI:** optional extraction of a draft maintenance reminder from a selected manual/receipt. Date/cadence and source location require review; no auto-enrollment from every uploaded document.

**Failure behavior:** retry cannot generate duplicate chores. Pausing a template stops future generation; it does not delete completed task history. A deleted Home entity leaves a descriptive broken reference rather than deleting maintenance instructions.

**Acceptance:** completing a completion-relative task generates exactly one next occurrence; series edits do not rewrite past completions; an unavailable Home integration does not prevent manual maintenance tracking.

## M07 · Track bills, subscriptions and savings targets

Priority: Interested. Module: `finance`. Routes: `/life/finance`.

**User behavior:** manually record an upcoming bill, subscription renewal or self-defined savings target. Show due dates, amounts/currencies and selected reminders; mark a payment record manually with provenance. Provide a private monthly overview.

**Owned data:** `obligation`, `subscription`, `savings_target`, `manual_balance_entry`, `finance_reminder_link`. Store money in exact decimal/minor-unit representations with currency, not binary floating point. Do not sum different currencies without an explicit conversion source/date.

**Interfaces:** `saveObligation`, `saveSubscription`, `recordBalance`, `requestReminder`, `getPrivateSummary`. Tasks/Calendar receive minimum reminder information chosen by the user; display-role summaries exclude balances and private descriptions.

**AI:** optional categorization of deliberately imported records. Bank connections, payment execution, investment advice and automatic transfers are outside this initial capability.

**Failure behavior:** no account integration means manual values show their entry date, not “live balance.” Completing a reminder does not claim a bill was paid. A missing exchange rate prevents a converted total.

**Acceptance:** financial records are inaccessible to a paired display; amount precision survives export/import; no record action initiates a financial transaction.
