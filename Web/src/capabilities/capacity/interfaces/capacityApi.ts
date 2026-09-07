import { completed, newId, nowIso, wait } from '../../../shared/api/mock'
import type { Operation } from '../../../shared/contracts/common'
import type { Candidate, PlanningInput, PlanningSession } from './types'

/* Capacity HTTP adapter (mock): /api/v1/capacity/... Deterministic selection first; AI only explains. */

const pool: Omit<Candidate, 'reasons' | 'decision'>[] = [
  { id: 'c_1', resource: { owner: 'tasks', kind: 'task', id: 'tsk_1' }, title: 'Outline chapter 4 recall prompts', minutes: 45, effort: 'deep', source: 'tasks', route: '/tasks/tsk_1', aiNote: 'You tend to finish deep-focus study work in the morning; this is your only explicit priority today.' },
  { id: 'c_2', resource: { owner: 'tasks', kind: 'task', id: 'tsk_2' }, title: 'Book dentist appointment', minutes: 10, effort: 'light', source: 'tasks', route: '/tasks/tsk_2' },
  { id: 'c_3', resource: { owner: 'tasks', kind: 'task', id: 'tsk_3' }, title: 'Reply to landlord about radiator', minutes: 15, effort: 'light', source: 'tasks', route: '/tasks/tsk_3', aiNote: 'Overdue by a day; small enough to close the loop.' },
  { id: 'c_4', resource: { owner: 'reviews', kind: 'summary', id: 'due' }, title: '12 spaced reviews due', minutes: 20, effort: 'medium', source: 'reviews', route: '/learn/review' },
  { id: 'c_5', resource: { owner: 'study', kind: 'checkpoint', id: 'chk_3' }, title: 'Resume: working memory (loop vs buffer)', minutes: 30, effort: 'deep', source: 'study', route: '/learn/resume' },
  { id: 'c_6', resource: { owner: 'tasks', kind: 'task', id: 'tsk_6' }, title: 'Practise self-introduction (Japanese)', minutes: 20, effort: 'medium', source: 'tasks', route: '/tasks/tsk_6' },
  { id: 'c_7', resource: { owner: 'tasks', kind: 'task', id: 'tsk_9' }, title: 'Read: Attention and working memory (pp. 41–58)', minutes: 35, effort: 'deep', source: 'tasks', route: '/tasks/tsk_9' },
]

const effortRank = { light: 1, medium: 2, deep: 3 }

export async function createPlanningSession(input: PlanningInput): Promise<Operation<PlanningSession>> {
  await wait(650)
  const buffer = Math.round(input.availableMinutes * 0.15)
  let remaining = input.availableMinutes - buffer
  const excluded: PlanningSession['excluded'] = []
  const eligible = pool.filter((item) => {
    if (input.effort !== 'any' && effortRank[item.effort] > effortRank[input.effort]) {
      excluded.push({ title: item.title, reason: `effort ${item.effort} exceeds preference` })
      return false
    }
    if (!input.includeLearning && (item.source === 'study' || item.source === 'reviews')) {
      excluded.push({ title: item.title, reason: 'learning excluded' })
      return false
    }
    if (!input.includeAdmin && /dentist|landlord/i.test(item.title)) {
      excluded.push({ title: item.title, reason: 'admin excluded' })
      return false
    }
    return true
  })
  // Deterministic: priority/deadline order, fit within budget, stable tie-break by id.
  const ordered = [...eligible].sort((a, b) => (a.id === 'c_1' ? -1 : b.id === 'c_1' ? 1 : a.id === 'c_3' ? -1 : b.id === 'c_3' ? 1 : a.id.localeCompare(b.id)))
  const candidates: Candidate[] = []
  for (const item of ordered) {
    if (item.minutes <= remaining) {
      remaining -= item.minutes
      const reasons = [`fits with ${remaining} min left`, item.id === 'c_1' ? 'explicit priority · due today' : item.id === 'c_3' ? 'overdue' : `${item.source} candidate`]
      candidates.push({ ...item, reasons })
    } else {
      excluded.push({ title: item.title, reason: `needs ${item.minutes} min, ${remaining} min left` })
    }
    if (candidates.length >= 5) break
  }
  return completed({ id: newId('ps'), input, candidates, bufferMinutes: buffer, calendarFreshness: 'current', excluded, createdAt: nowIso() })
}

export async function recordDecision(sessionId: string, candidateId: string, decision: 'accepted' | 'dismissed' | 'scheduled'): Promise<Operation<{ sessionId: string; candidateId: string; decision: string }>> {
  await wait(160)
  return completed({ sessionId, candidateId, decision })
}
