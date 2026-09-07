import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { MemoryItem } from './types'

/* Memory HTTP adapter (mock): /api/v1/memory/... Every item resolves to evidence; corrections beat inference. */

let items: MemoryItem[] = [
  { id: 'mem_1', type: 'stated_preference', statement: 'Prefers short study sessions on weekday evenings.', status: 'active', validFrom: minutesAgo(40000), lastAppliedAt: minutesAgo(40), appliedCount: 9, extractorVersion: 'memory.extract@v3', provenance: 'explicit', evidence: [{ id: 'ev_1', ref: 'conversations/message/m_old_12', kind: 'conversation', excerpt: '“Keep study blocks to 20–30 minutes on weekdays, I fade after that.”', at: minutesAgo(40000), route: '/conversations/thr_3', valid: true }], revision: 2 },
  { id: 'mem_2', type: 'inferred_pattern', statement: 'Often dismisses long sessions suggested late at night.', status: 'active', confidence: { label: 'model assessment: moderate', note: 'Not an objective probability of truth.' }, validFrom: minutesAgo(20000), lastAppliedAt: minutesAgo(400), appliedCount: 3, extractorVersion: 'memory.extract@v3', provenance: 'inferred', counts: { observed: 7, window: 'last 30 days' }, evidence: [{ id: 'ev_2', ref: 'usage/aggregate/today.dismiss.learning.late', kind: 'usage', excerpt: '7 of 9 learning cards presented after 22:00 were dismissed', at: minutesAgo(500), route: '/history/usage', valid: true }], revision: 1 },
  { id: 'mem_3', type: 'stated_fact', statement: 'Cognition exam is on 14 September; memory models weigh 35%.', status: 'active', validFrom: minutesAgo(9000), validTo: undefined, lastAppliedAt: minutesAgo(41), appliedCount: 5, extractorVersion: 'memory.extract@v3', provenance: 'confirmed', evidence: [{ id: 'ev_3', ref: 'exams/blueprint_revision/bp_2@2', kind: 'feature', excerpt: 'Blueprint r2 · date 2026-09-14 · memory 35', at: minutesAgo(9000), route: '/learn/exams/exam_cog', valid: true }], revision: 1 },
  { id: 'mem_4', type: 'inferred_pattern', statement: 'Likes the Evening scene warmer than saved.', status: 'conflicted', confidence: { label: 'model assessment: low', note: 'Two manual overrides in one week; could be seasonal.' }, validFrom: minutesAgo(6000), appliedCount: 0, extractorVersion: 'memory.extract@v3', provenance: 'inferred', counts: { observed: 2, window: 'last 7 days' }, conflict: { with: 'Scene “Evening” r3 was saved by you 4 days ago with the current values.', note: 'Conflicting evidence stays visible rather than overwriting.' }, evidence: [{ id: 'ev_4', ref: 'home/device_operation/op_7', kind: 'feature', excerpt: 'Floor lamp 40% → 55% warm, 22:10, manual', at: minutesAgo(6000), route: '/home', valid: true }], revision: 1 },
  { id: 'mem_5', type: 'working_summary', statement: 'Currently focused on exam preparation; Japanese practice is secondary until mid-September.', status: 'active', validFrom: minutesAgo(3000), validTo: minutesAgo(-12960), lastAppliedAt: minutesAgo(40), appliedCount: 2, extractorVersion: 'memory.summarise@v1', provenance: 'inferred', evidence: [{ id: 'ev_5', ref: 'conversations/thread/thr_3', kind: 'conversation', excerpt: 'Planning the week around the exam', at: minutesAgo(4000), route: '/conversations/thr_3', valid: true }, { id: 'ev_6', ref: 'goals/goal/goal_1', kind: 'feature', excerpt: 'Active goal with target in 9 days', at: minutesAgo(3000), route: '/goals/goal_1', valid: true }], revision: 1 },
  { id: 'mem_6', type: 'inferred_pattern', statement: 'Reads sources in the morning.', status: 'superseded', validFrom: minutesAgo(90000), validTo: minutesAgo(40000), appliedCount: 4, extractorVersion: 'memory.extract@v2', provenance: 'inferred', evidence: [{ id: 'ev_7', ref: 'knowledge/source/src_deleted', kind: 'feature', excerpt: '(source deleted; evidence invalid)', at: minutesAgo(90000), valid: false }], revision: 3 },
]

export async function listMemory(): Promise<Snapshot<MemoryItem[]>> {
  await wait()
  return snapshot(items)
}

export async function correctMemory(id: string, statement: string): Promise<Operation<MemoryItem>> {
  await wait(280)
  const item = items.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: MemoryItem = { ...item, statement, type: item.type === 'inferred_pattern' ? 'stated_preference' : item.type, provenance: 'explicit', status: 'active', conflict: undefined, revision: item.revision + 1, evidence: [{ id: newId('ev'), ref: `conversations/message/${newId('m')}`, kind: 'conversation', excerpt: `Corrected by you: “${statement}”`, at: nowIso(), valid: true }, ...item.evidence] }
  items = items.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function forgetMemory(id: string): Promise<Operation<MemoryItem>> {
  await wait(220)
  const item = items.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: MemoryItem = { ...item, status: 'suppressed', validTo: nowIso(), revision: item.revision + 1 }
  items = items.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function confirmMemory(id: string): Promise<Operation<MemoryItem>> {
  await wait(180)
  const item = items.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: MemoryItem = { ...item, provenance: 'confirmed', status: 'active', conflict: undefined, revision: item.revision + 1 }
  items = items.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}
