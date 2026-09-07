import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { FinanceSummary, Obligation, SavingsTarget } from './types'

/* Finance HTTP adapter (mock): /api/v1/finance/... Money is minor units + currency; no floats, no bank connection. */

let obligations: Obligation[] = [
  { id: 'ob_1', kind: 'bill', name: 'Rent', amount: { minor: 95000, currency: 'EUR' }, dueAt: daysFromNow(3), cadence: 'monthly', reminder: { channel: 'calendar', daysBefore: 2, taskRef: 'evt_5' }, lastPayment: { at: minutesAgo(40000), provenance: 'manual' } },
  { id: 'ob_2', kind: 'bill', name: 'Electricity', amount: { minor: 6240, currency: 'EUR' }, dueAt: daysFromNow(11), cadence: 'monthly' },
  { id: 'ob_3', kind: 'subscription', name: 'Language tutor (Yuki)', amount: { minor: 12000, currency: 'EUR' }, dueAt: daysFromNow(6), cadence: 'monthly', reminder: { channel: 'tasks', daysBefore: 1 } },
  { id: 'ob_4', kind: 'subscription', name: 'Anki sync (legacy)', amount: { minor: 2500, currency: 'USD' }, dueAt: daysFromNow(20), cadence: 'yearly' },
]

let savings: SavingsTarget[] = [
  { id: 'sv_1', name: 'Spring trip to Japan', target: { minor: 240000, currency: 'EUR' }, balance: { minor: 131500, currency: 'EUR' }, balanceEnteredAt: minutesAgo(9000) },
  { id: 'sv_2', name: 'Emergency buffer', target: { minor: 300000, currency: 'EUR' }, balance: { minor: 300000, currency: 'EUR' }, balanceEnteredAt: minutesAgo(60000) },
]

export async function getPrivateSummary(): Promise<Snapshot<FinanceSummary>> {
  await wait()
  const totals = new Map<string, number>()
  for (const item of obligations) totals.set(item.amount.currency, (totals.get(item.amount.currency) ?? 0) + item.amount.minor)
  return snapshot({ obligations, savings, monthTotals: Array.from(totals, ([currency, minor]) => ({ currency, minor })), conversionNote: totals.size > 1 ? 'Different currencies are not summed without an explicit conversion source and date.' : undefined })
}

export async function markPaid(id: string): Promise<Operation<Obligation>> {
  await wait(200)
  const item = obligations.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: Obligation = { ...item, lastPayment: { at: nowIso(), provenance: 'manual' }, dueAt: daysFromNow(30) }
  obligations = obligations.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function recordBalance(id: string, minor: number): Promise<Operation<SavingsTarget>> {
  await wait(200)
  const item = savings.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next = { ...item, balance: { ...item.balance, minor }, balanceEnteredAt: nowIso() }
  savings = savings.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function saveObligation(draft: Omit<Obligation, 'id'>): Promise<Operation<Obligation>> {
  await wait(260)
  if (!draft.name.trim()) return failedOperation('validation', false, 'Name it.')
  const item = { ...draft, id: newId('ob') }
  obligations = [...obligations, item]
  return completed(item)
}

export async function requestReminder(id: string, channel: 'tasks' | 'calendar', daysBefore: number): Promise<Operation<Obligation>> {
  await wait(300)
  const item = obligations.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: Obligation = { ...item, reminder: { channel, daysBefore, taskRef: newId(channel === 'tasks' ? 'tsk' : 'blk') } }
  obligations = obligations.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}
