import { completed, failedOperation, hoursFromNow, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { AlertInstance, AlertRule } from './types'

/* Home Alerts HTTP adapter (mock): /api/v1/home-alerts/... */

let rules: AlertRule[] = [
  { id: 'rule_1', name: 'Balcony sensor offline', kind: 'device_unavailable', deviceName: 'Soil moisture', condition: 'unavailable or unknown', persistenceMinutes: 120, quietChannel: true, enabled: true, revision: 2 },
  { id: 'rule_2', name: 'Bedroom too humid', kind: 'threshold', deviceName: 'Bedroom sensor', condition: 'humidity > 65%', persistenceMinutes: 30, quietChannel: false, enabled: true, revision: 1 },
  { id: 'rule_3', name: 'Laundry finished', kind: 'cycle_finished', deviceName: 'Washing machine plug', condition: 'power drops below 5 W after > 100 W for 10 min', persistenceMinutes: 5, quietChannel: true, enabled: false, revision: 3 },
]

let alerts: AlertInstance[] = [
  { id: 'alr_1', ruleId: 'rule_1', ruleName: 'Balcony sensor offline', severity: 'attention', openedAt: minutesAgo(60), why: 'Soil moisture has reported no state for 3 h 10 min, longer than the 2 h persistence window. Unknown is not treated as safe.', observations: [{ at: minutesAgo(190), value: '31%', state: 'available' }, { at: minutesAgo(170), value: '—', state: 'stale' }, { at: minutesAgo(120), value: '—', state: 'unavailable' }, { at: minutesAgo(5), value: '—', state: 'unknown' }], condition: 'active', notification: 'quiet_hours' },
  { id: 'alr_2', ruleId: 'rule_2', ruleName: 'Bedroom too humid', severity: 'notice', openedAt: minutesAgo(400), why: 'Humidity stayed above 65% for 42 min (threshold with hysteresis at 62%).', observations: [{ at: minutesAgo(440), value: '67%', state: 'available' }, { at: minutesAgo(410), value: '68%', state: 'available' }, { at: minutesAgo(300), value: '58%', state: 'available' }], condition: 'recovered', acknowledged: { at: minutesAgo(380), by: 'you' }, notification: 'delivered' },
]

export async function listAlerts(): Promise<Snapshot<{ alerts: AlertInstance[]; rules: AlertRule[] }>> {
  await wait(220)
  return snapshot({ alerts: alerts.filter((alert) => !alert.snoozedUntil || new Date(alert.snoozedUntil).getTime() < Date.now()), rules })
}

export async function acknowledgeAlert(id: string): Promise<Operation<AlertInstance>> {
  await wait(200)
  const alert = alerts.find((item) => item.id === id)
  if (!alert) return failedOperation('not_found', false)
  alert.acknowledged = { at: nowIso(), by: 'you' }
  return completed({ ...alert })
}

export async function snoozeAlert(id: string, hours: number): Promise<Operation<AlertInstance>> {
  await wait(160)
  const alert = alerts.find((item) => item.id === id)
  if (!alert) return failedOperation('not_found', false)
  alert.snoozedUntil = hoursFromNow(hours)
  return completed({ ...alert })
}

export async function configureRule(rule: Omit<AlertRule, 'revision' | 'id'> & { id?: string }): Promise<Operation<AlertRule>> {
  await wait(260)
  if (!rule.name.trim()) return failedOperation('validation', false, 'Name the rule.')
  const existing = rule.id ? rules.find((item) => item.id === rule.id) : undefined
  const next: AlertRule = { ...rule, id: existing?.id ?? newId('rule'), revision: (existing?.revision ?? 0) + 1 }
  rules = existing ? rules.map((item) => (item.id === existing.id ? next : item)) : [...rules, next]
  return completed(next)
}

export async function toggleRule(id: string): Promise<Operation<AlertRule>> {
  await wait(120)
  const rule = rules.find((item) => item.id === id)
  if (!rule) return failedOperation('not_found', false)
  rule.enabled = !rule.enabled
  rule.revision += 1
  return completed({ ...rule })
}
