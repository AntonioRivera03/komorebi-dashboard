import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { AutomationRule, AutomationRun, SimulationResult } from './types'

/* Automation HTTP adapter (mock): /api/v1/automation/... Rules reference a finite typed registry; no expression language. */

export const registry = {
  triggers: [
    { type: 'study.sessionStarted.v1', label: 'A study session starts' },
    { type: 'study.sessionEnded.v1', label: 'A study session ends' },
    { type: 'schedule.weekly', label: 'Weekly at a chosen time' },
    { type: 'home.stateObserved.v1', label: 'A permitted device reports state' },
  ],
  predicates: [
    { predicate: 'calendar.isFree(now)', label: 'No fixed commitment right now' },
    { predicate: 'home.deviceAvailable(dev_desk)', label: 'Desk lamp is available (not unknown)' },
    { predicate: 'time.between(17:00, 23:00)', label: 'Between 17:00 and 23:00' },
  ],
  actions: [
    { command: 'home.applyScene', label: 'Apply a granted scene', idempotent: true },
    { command: 'home.restoreSceneRun', label: 'Conditionally restore a scene run', idempotent: true },
    { command: 'notifications.deliver', label: 'Send a notification', idempotent: true },
    { command: 'capture.captureItem', label: 'Save a capture', idempotent: true },
  ],
}

let rules: AutomationRule[] = [
  { id: 'ar_1', name: 'Study start → Focus scene', revision: 3, status: 'enabled', trigger: { type: 'study.sessionStarted.v1', label: 'A study session starts' }, conditions: [{ predicate: 'home.deviceAvailable(dev_desk)', label: 'Desk lamp is available (not unknown)' }], actions: [{ command: 'home.applyScene', label: 'Apply scene “Focus” (r2)', idempotent: true }], grant: { scopes: ['home:scenes:scn_focus'], grantedAt: minutesAgo(30000) }, cooldownMinutes: 10, maxRunsPerDay: 6, preview: 'When a study session starts, if the desk lamp is available, apply the Focus scene. A lighting failure never affects the session.' },
  { id: 'ar_2', name: 'Study end → restore lights', revision: 1, status: 'enabled', trigger: { type: 'study.sessionEnded.v1', label: 'A study session ends' }, conditions: [], actions: [{ command: 'home.restoreSceneRun', label: 'Restore the last Focus run (skip manually changed devices)', idempotent: true }], grant: { scopes: ['home:scenes:scn_focus'], grantedAt: minutesAgo(30000) }, cooldownMinutes: 5, maxRunsPerDay: 6, preview: 'When a study session ends, restore devices the Focus scene changed, unless they were changed since.' },
  { id: 'ar_3', name: 'Sunday review nudge', revision: 2, status: 'paused', trigger: { type: 'schedule.weekly', label: 'Sunday 17:30' }, conditions: [{ predicate: 'calendar.isFree(now)', label: 'No fixed commitment right now' }], actions: [{ command: 'notifications.deliver', label: 'Notify “Weekly review in 30 minutes”', idempotent: true }], grant: { scopes: ['notifications:deliver'], grantedAt: minutesAgo(90000) }, cooldownMinutes: 1440, maxRunsPerDay: 1, preview: 'Every Sunday at 17:30, if nothing is scheduled, send a quiet reminder.' },
]

let runs: AutomationRun[] = [
  { id: 'run_a1', ruleId: 'ar_1', ruleName: 'Study start → Focus scene', ruleRevision: 3, triggerEventId: 'evt_study_ses_2', startedAt: minutesAgo(1400), status: 'partial', steps: [{ id: 's1', command: 'home.applyScene', status: 'completed', detail: 'Scene run run_f1: desk lamp acknowledged (stale), monitor bar confirmed', idempotencyKey: 'run_a1:s1' }], evaluated: [{ ref: 'home/device/dev_desk', revision: 3 }, { ref: 'home/scene/scn_focus', revision: 2 }] },
  { id: 'run_a2', ruleId: 'ar_1', ruleName: 'Study start → Focus scene', ruleRevision: 3, triggerEventId: 'evt_study_ses_2', startedAt: minutesAgo(1399), status: 'skipped', steps: [], evaluated: [] },
  { id: 'run_a3', ruleId: 'ar_3', ruleName: 'Sunday review nudge', ruleRevision: 2, triggerEventId: 'sched_2026-08-30', startedAt: minutesAgo(9000), status: 'completed', steps: [{ id: 's1', command: 'notifications.deliver', status: 'completed', detail: 'Delivered on quiet channel', idempotencyKey: 'run_a3:s1' }], evaluated: [{ ref: 'calendar/agenda/now', revision: 11 }] },
]

export async function listRules(): Promise<Snapshot<{ rules: AutomationRule[]; runs: AutomationRun[] }>> {
  await wait()
  return snapshot({ rules, runs })
}

export async function simulateRule(ruleId: string): Promise<Operation<SimulationResult>> {
  await wait(900)
  const rule = rules.find((item) => item.id === ruleId)
  if (!rule) return failedOperation('not_found', false)
  const unknown = rule.conditions.some((condition) => condition.predicate.includes('dev_desk'))
  return completed({ wouldRun: !unknown, reasons: unknown ? ['home.deviceAvailable(dev_desk) → unknown (stale 48 min). Unknown does not count as true.'] : ['All conditions evaluated true on current data.', `Grant ${rule.grant.scopes.join(', ')} is current.`], steps: rule.actions.map((action) => ({ command: action.command, label: action.label })) })
}

export async function setRuleStatus(ruleId: string, status: AutomationRule['status']): Promise<Operation<AutomationRule>> {
  await wait(220)
  const rule = rules.find((item) => item.id === ruleId)
  if (!rule) return failedOperation('not_found', false)
  rule.status = status
  return completed({ ...rule })
}

export async function saveRuleDraft(draft: Pick<AutomationRule, 'name' | 'trigger' | 'conditions' | 'actions'>): Promise<Operation<AutomationRule>> {
  await wait(300)
  if (!draft.name.trim() || draft.actions.length === 0) return failedOperation('validation', false, 'Name the rule and choose at least one action.')
  const rule: AutomationRule = { id: newId('ar'), revision: 1, status: 'draft', grant: { scopes: draft.actions.map((action) => action.command), grantedAt: nowIso() }, cooldownMinutes: 10, maxRunsPerDay: 5, preview: `When ${draft.trigger.label.toLowerCase()}${draft.conditions.length ? `, if ${draft.conditions.map((c) => c.label.toLowerCase()).join(' and ')}` : ''}, ${draft.actions.map((a) => a.label.toLowerCase()).join(' and ')}.`, ...draft }
  rules = [...rules, rule]
  return completed(rule)
}
