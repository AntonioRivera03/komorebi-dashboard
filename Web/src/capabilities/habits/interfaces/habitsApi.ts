import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { CheckinKind, Habit } from './types'

const today = new Date().toISOString().slice(0, 10)
const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10)

let habits: Habit[] = [
  { id: 'hb_1', cue: 'After the evening walk', action: '20-minute study block', fallback: 'Read one source passage', cadence: 'weekdays', paused: false, checkins: [{ periodKey: day(1), kind: 'completed', at: minutesAgo(1400) }, { periodKey: day(2), kind: 'fallback', at: minutesAgo(2900) }, { periodKey: day(3), kind: 'resting', at: minutesAgo(4300) }, { periodKey: day(4), kind: 'completed', at: minutesAgo(5700) }], reminder: { channel: 'quiet', quietHours: true } },
  { id: 'hb_2', cue: 'Coffee is brewing', action: 'Review 10 due cards', fallback: 'Flip 3 cards', cadence: 'daily', paused: false, checkins: [{ periodKey: today, kind: 'completed', at: minutesAgo(300) }, { periodKey: day(1), kind: 'skipped', at: minutesAgo(1500) }], taskSeriesRef: 'ser_review_cards' },
  { id: 'hb_3', cue: 'Sunday 18:00', action: 'Weekly review', cadence: 'weekly', paused: true, checkins: [{ periodKey: day(7), kind: 'completed', at: minutesAgo(10000) }] },
]

export async function listHabits(): Promise<Snapshot<Habit[]>> {
  await wait()
  return snapshot(habits)
}

export async function checkIn(id: string, kind: CheckinKind, periodKey = today): Promise<Operation<Habit>> {
  await wait(180)
  const habit = habits.find((item) => item.id === id)
  if (!habit) return failedOperation('not_found', false)
  const existing = habit.checkins.find((entry) => entry.periodKey === periodKey)
  if (existing) existing.kind = kind
  else habit.checkins = [{ periodKey, kind, at: nowIso() }, ...habit.checkins]
  return completed({ ...habit })
}

export async function pauseHabit(id: string, paused: boolean): Promise<Operation<Habit>> {
  await wait(140)
  const habit = habits.find((item) => item.id === id)
  if (!habit) return failedOperation('not_found', false)
  habit.paused = paused
  return completed({ ...habit })
}

export async function createHabit(cue: string, action: string, fallback: string, cadence: string): Promise<Operation<Habit>> {
  await wait(240)
  if (!cue.trim() || !action.trim()) return failedOperation('validation', false, 'A habit needs a cue and an action.')
  const habit: Habit = { id: newId('hb'), cue, action, fallback: fallback || undefined, cadence, paused: false, checkins: [] }
  habits = [...habits, habit]
  return completed(habit)
}

export const todayKey = today
