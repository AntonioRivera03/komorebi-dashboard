import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { AgendaItem, BlockLifecycle, BlockProposal, CalendarConnection, ProviderOperation } from './types'

/* Calendar HTTP adapter (mock): /api/v1/calendar/... */

const tz = 'Europe/Madrid'

let agenda: AgendaItem[] = [
  { id: 'evt_1', kind: 'provider', title: 'Standup with the lab', start: daysFromNow(0, 9, 0), end: daysFromNow(0, 9, 20), calendar: 'Work', timeZone: tz, recurring: true, providerRevision: 'e7' },
  { id: 'blk_1', kind: 'block', title: 'Chapter 4 prompts', start: daysFromNow(0, 9, 30), end: daysFromNow(0, 10, 15), taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_1', revision: 3 }, lifecycle: 'synced', timeZone: tz },
  { id: 'evt_2', kind: 'provider', title: 'Cognition seminar', start: daysFromNow(0, 14, 30), end: daysFromNow(0, 16, 0), calendar: 'University', location: 'Room B2.14', timeZone: tz, providerRevision: 'e12' },
  { id: 'blk_2', kind: 'block', title: 'Working memory: loop vs buffer', start: daysFromNow(0, 19, 30), end: daysFromNow(0, 20, 10), taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_9' }, lifecycle: 'confirmed', timeZone: tz },
  { id: 'evt_3', kind: 'provider', title: 'Easy run 5 km', start: daysFromNow(1, 8, 0), end: daysFromNow(1, 8, 45), calendar: 'Personal', timeZone: tz, providerRevision: 'e3' },
  { id: 'blk_3', kind: 'block', title: 'Dentist call', start: daysFromNow(1, 12, 0), end: daysFromNow(1, 12, 15), taskRef: { owner: 'tasks', kind: 'task', id: 'tsk_2' }, lifecycle: 'unknown_outcome', timeZone: tz, conflict: 'Provider timed out after send. Reconciling with correlation marker before any retry.' },
  { id: 'evt_4', kind: 'provider', title: 'Yuki · dinner', start: daysFromNow(2, 20, 0), end: daysFromNow(2, 22, 0), calendar: 'Personal', timeZone: tz, providerRevision: 'e9', conflict: 'Edited elsewhere: time moved 19:30 → 20:00. Mirror refreshed; your block association kept.' },
  { id: 'evt_5', kind: 'provider', title: 'Rent due', start: daysFromNow(3, 0, 0), end: daysFromNow(3, 23, 59), allDay: true, calendar: 'Personal', timeZone: tz, providerRevision: 'e1' },
  { id: 'blk_4', kind: 'block', title: 'Practice set 2 (timed)', start: daysFromNow(3, 17, 0), end: daysFromNow(3, 17, 40), taskRef: { owner: 'exams', kind: 'practice_run', id: 'pr_2' }, lifecycle: 'proposed', timeZone: tz },
  { id: 'evt_6', kind: 'provider', title: 'Cognition exam', start: daysFromNow(9, 10, 0), end: daysFromNow(9, 12, 0), calendar: 'University', location: 'Main hall', timeZone: tz, providerRevision: 'e2' },
]

let connection: CalendarConnection = {
  id: 'cc_1',
  provider: 'CalDAV',
  account: 'antonio@…',
  mode: 'read',
  status: 'synced',
  lastCursorAt: minutesAgo(6),
  pendingOperations: 1,
  calendars: [
    { id: 'cal_work', name: 'Work', color: 'var(--accent)', enabled: true },
    { id: 'cal_uni', name: 'University', color: 'var(--symbol)', enabled: true },
    { id: 'cal_personal', name: 'Personal', color: 'var(--muted)', enabled: true },
    { id: 'cal_shared', name: 'Shared household', color: 'var(--line)', enabled: false },
  ],
}

let operations: ProviderOperation[] = [
  { id: 'op_1', blockId: 'blk_3', title: 'Dentist call', state: 'unknown_outcome', startedAt: minutesAgo(30), detail: 'Sent 12:01:14 · no acknowledgement in 20 s · reconciliation queued' },
  { id: 'op_2', blockId: 'blk_1', title: 'Chapter 4 prompts', state: 'synced', startedAt: minutesAgo(900), detail: 'Provider etag e7 · confirmed' },
]

export async function listAgenda(fromDay: number, days: number): Promise<Snapshot<AgendaItem[]>> {
  await wait(260)
  const from = new Date(daysFromNow(fromDay, 0)).getTime()
  const to = new Date(daysFromNow(fromDay + days, 0)).getTime()
  const items = agenda.filter((item) => new Date(item.start).getTime() >= from && new Date(item.start).getTime() < to).sort((a, b) => a.start.localeCompare(b.start))
  return snapshot(items, connection.status === 'stale' ? 'stale' : 'current')
}

export async function getConnection(): Promise<Snapshot<CalendarConnection>> {
  await wait(180)
  return snapshot(connection)
}

export async function listOperations(): Promise<Snapshot<ProviderOperation[]>> {
  await wait(150)
  return snapshot(operations)
}

export async function proposeBlock(taskId: string, taskTitle: string, start: string, durationMinutes: number): Promise<Operation<BlockProposal>> {
  await wait(500)
  const startDate = new Date(start)
  const end = new Date(startDate.getTime() + durationMinutes * 60_000)
  const conflicts = agenda
    .filter((item) => item.kind === 'provider' && !item.allDay)
    .filter((item) => new Date(item.start) < end && new Date(item.end) > startDate)
    .map((item) => ({ with: item.title, overlapMinutes: Math.round((Math.min(new Date(item.end).getTime(), end.getTime()) - Math.max(new Date(item.start).getTime(), startDate.getTime())) / 60_000) }))
  const alternatives = conflicts.length
    ? [
        { start: new Date(startDate.getTime() + 2 * 3_600_000).toISOString(), end: new Date(end.getTime() + 2 * 3_600_000).toISOString(), reason: 'Next free slot after the fixed commitment' },
        { start: new Date(startDate.getTime() + 24 * 3_600_000).toISOString(), end: new Date(end.getTime() + 24 * 3_600_000).toISOString(), reason: 'Same time tomorrow' },
      ]
    : []
  return completed({ id: newId('prop'), taskRef: { owner: 'tasks', kind: 'task', id: taskId }, taskTitle, start: startDate.toISOString(), end: end.toISOString(), timeZone: tz, conflicts, alternatives })
}

export async function confirmBlock(proposal: BlockProposal): Promise<Operation<AgendaItem>> {
  await wait(350)
  const block: AgendaItem = { id: newId('blk'), kind: 'block', title: proposal.taskTitle, start: proposal.start, end: proposal.end, taskRef: proposal.taskRef, lifecycle: connection.mode === 'read' ? 'confirmed' : 'queued', timeZone: proposal.timeZone }
  agenda = [...agenda, block]
  return completed(block)
}

export async function cancelBlock(id: string, scope: 'occurrence' | 'series'): Promise<Operation<AgendaItem>> {
  await wait(220)
  const block = agenda.find((item) => item.id === id)
  if (!block) return failedOperation('not_found', false)
  const next = { ...block, lifecycle: 'canceled' as BlockLifecycle }
  agenda = agenda.map((item) => (item.id === id ? next : item))
  operations = [{ id: newId('op'), blockId: id, title: block.title, state: 'canceled', startedAt: nowIso(), detail: scope === 'series' ? 'Series canceled' : 'Occurrence canceled · local state only' }, ...operations]
  return completed(next)
}

export async function refreshConnection(): Promise<Operation<CalendarConnection>> {
  await wait(900)
  connection = { ...connection, status: 'synced', lastCursorAt: nowIso() }
  return completed(connection)
}

export async function toggleCalendar(calendarId: string): Promise<Operation<CalendarConnection>> {
  await wait(120)
  connection = { ...connection, calendars: connection.calendars.map((cal) => (cal.id === calendarId ? { ...cal, enabled: !cal.enabled } : cal)) }
  return completed(connection)
}

export async function reconcileOperation(id: string): Promise<Operation<ProviderOperation>> {
  await wait(1100)
  const op = operations.find((item) => item.id === id)
  if (!op) return failedOperation('not_found', false)
  const next: ProviderOperation = { ...op, state: 'synced', detail: 'Reconciled: provider had created the event (correlation marker found). No duplicate written.' }
  operations = operations.map((item) => (item.id === id ? next : item))
  agenda = agenda.map((item) => (item.id === op.blockId ? { ...item, lifecycle: 'synced', conflict: undefined } : item))
  return completed(next)
}
