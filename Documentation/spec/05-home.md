# F3 · Apartment control

[Specification index](../SPEC.md)

Fundamental: operate the apartment, know what actually responded and surface exceptions worth attention. Komorebi is a personal interface over compatible home integrations, not a replacement implementation of every device protocol.

## H01 · Control devices and reconcile reported state

Priority: Essential. Module: `home`. Routes: `/home`, `/home/rooms/:id`, `/home/connections`.

**User behavior**

- Connect a Home Assistant installation, select permitted entities and organize their display by room.
- Control initially supported entity types: lights, safe switches and climate setpoints. Show only actions the adapter reports as supported.
- See reported state, last observation time and `available | stale | unavailable | unknown` status.
- After a command, distinguish request accepted, provider acknowledgement and confirmed observed state. Partial/ambiguous results remain visible.

**Owned data:** `home_connection` with secret reference, `room_mapping`, `device_mapping`, `device_state_mirror`, `device_operation`. Device/provider IDs are internal adapter mappings; browser clients use Komorebi device IDs and typed supported actions.

**Interfaces:** `listRooms`, `listDevices`, `setDeviceState`, `getDeviceSnapshot`, `getOperation`. `HomePort` exposes actions such as `setLight` or `setClimateSetpoint` with validated units/ranges; it does not expose an arbitrary Home Assistant service-call endpoint to AI, display clients or other capabilities.

**Integration:** use a server-side Home Assistant adapter for reads/commands and subscribed state updates. Initial snapshot + subscription recovery must converge after a disconnect; record when the snapshot was reconciled. Only one leased worker owns a connection’s live subscription at a time. Confirm action support/units from entity metadata.

**Command lifecycle:** `queued → sent → acknowledged → confirmed`, with terminal `failed`, `partial`, `timed_out` or `unknown_outcome` as applicable. Commands with observable targets confirm from matching reported state after the operation, not an old pre-command value. Actions without observable confirmation report acknowledgement without claiming stronger evidence.

**AI:** none in device execution or reconciliation. Assistant/Voice may translate explicit requests into the same constrained command API.

**Failure behavior:** disconnect marks stale/unavailable state, preserves the last observation and blocks false confirmation. Retry only safe/reconcilable operations. Never replay an expired actuator command on reconnection. Local controls depend on the actual device integration; Komorebi does not promise all devices work offline.

**Acceptance**

1. A command to an offline entity never displays confirmed success.
2. A manual change outside Komorebi updates the mirror after reconciliation.
3. An unauthorized display cannot invoke unlisted entities/actions.
4. Disconnect/reconnect recovers current state without applying an old queued command unexpectedly.

Reference: [Home Assistant API](https://www.home-assistant.io/integrations/api/) and [WebSocket API](https://developers.home-assistant.io/docs/api/websocket/) provide the integration surface; actual entities and permissions must be discovered during setup.

## H02 · Apply and edit named room scenes

Priority: Essential. Module: `home`. Routes: `/home/scenes`, `/home/scenes/:id`.

**User behavior:** define a named set of supported device targets, preview it, apply it manually and inspect per-device results. Optionally expose a named scene to Today/Voice or grant it to an Automation rule. Imported provider scenes and Komorebi-authored scenes are clearly distinguished.

**Owned data:** `scene`, immutable `scene_revision`, `scene_target`, `scene_run`, `scene_run_target`. A run pins its scene revision and optional pre-run snapshots for conditional restoration.

**Interfaces:** `createScene`, `reviseScene`, `previewScene`, `applyScene`, `restoreSceneRun`. Consumers pass a scene ID/revision; Home resolves and authorizes individual target actions. A scene has a permission scope independent of its label.

**AI:** may draft an editable scene proposal through Assistant; it cannot silently enable new entity access.

**Failure behavior:** device commands are not an atomic distributed transaction. Report each result and aggregate `completed | partial | failed`. No global rollback guarantee. Restoration skips devices changed since the scene’s own operation and displays which ones were skipped. Scene definitions with deleted entities require repair.

**Acceptance:** applying a two-device scene with one unavailable device reports a partial result; a manual change after the scene is preserved on conditional restore; disabling Automation leaves all manual scene functions intact.

## H03 · Detect and acknowledge home exceptions

Priority: Essential. Module: `home-alerts`. Route: `/home/alerts`.

**User behavior:** configure a bounded set of alert rules, including unavailable devices, persistent threshold conditions, and a supported “cycle finished” observation. Choose duration/persistence, quiet-channel preference and how to acknowledge or snooze. View why an alert opened and the observations used.

**Owned data:** `alert_rule`, `rule_state`, `alert_instance`, `alert_acknowledgment`. Rule state tracks an episode, prior condition and persistence window. Notification delivery status remains Core Notifications-owned.

**Interfaces:** consumes minimal Home state facts, reads current authorized snapshots, publishes `alertOpened`, and requests notification delivery. `listActiveAlerts` contributes a safe Today summary. Household maintenance dates belong to Household, not a parallel home-alert due-date database.

**AI:** none for threshold decisions. Optional explanatory copy can never change the condition, severity or recommended action beyond the configured rule.

**Failure behavior:** unknown state is distinct from a false predicate. Use hysteresis/persistence and per-episode deduplication where applicable. On restart, reconcile current readings and persisted rule state before notifying; a missing historical interval cannot prove that a condition persisted. Acknowledgement and condition recovery are separate states.

**Acceptance:** a noisy threshold does not create repeated alerts for one episode; missing observations do not imply completed laundry; acknowledging an alert updates Home Alerts even if notification delivery fails.

## Home-specific boundary rules

- Home owns entity semantics; Automation owns cross-capability orchestration; Home Alerts owns exception interpretation.
- Core Notifications transports messages and respects channel/quiet-hour policy. It does not evaluate sensors.
- Sensitive devices such as locks are excluded from the initial supported-action set. Adding them requires an explicit action policy and acceptance tests, not just allowing arbitrary service names.
- High-frequency sensor updates stay within Home until converted to minimal authorized events/contributions. No global browser store contains all device traffic.
