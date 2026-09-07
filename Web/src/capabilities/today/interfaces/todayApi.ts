import { completed, daysFromNow, hoursFromNow, minutesAgo, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ContributionKind, Dismissal, TodayContribution, TodayLayout, TodayResponse } from './types'

/* Today HTTP adapter (mock): /api/v1/today. Producers run server-side with short timeouts. */

let layout: TodayLayout = { pinned: ['tasks:tsk_1'], order: ['exception', 'commitment', 'action', 'learning', 'home'], hidden: [] }
let dismissals: Dismissal[] = []

const contributions: TodayContribution[] = [
  { key: 'home-alerts:alr_1', producer: 'home-alerts', kind: 'exception', title: 'Balcony sensor unavailable for 3 h', summary: 'Last observation 07:41. The “laundry done” rule cannot evaluate while this is unknown.', resource: { owner: 'home-alerts', kind: 'alert_instance', id: 'alr_1' }, route: '/home/alerts', observedAt: minutesAgo(5), freshness: 'current', visibility: 'private', priority: 95, why: 'Configured rule “device unavailable > 2 h”. Unknown state is not treated as safe.', meta: 'unacknowledged' },
  { key: 'calendar:evt_2', producer: 'calendar', kind: 'commitment', title: 'Cognition seminar', summary: 'Room B2.14 · provider event', resource: { owner: 'calendar', kind: 'provider_event', id: 'evt_2' }, route: '/calendar', observedAt: minutesAgo(6), freshness: 'current', visibility: 'display', priority: 80, why: 'Next fixed commitment.', meta: daysFromNow(0, 14, 30) },
  { key: 'tasks:tsk_1', producer: 'tasks', kind: 'action', title: 'Outline chapter 4 recall prompts', summary: '45 min · deep focus · due today 18:00', resource: { owner: 'tasks', kind: 'task', id: 'tsk_1', revision: 3 }, route: '/tasks/tsk_1', observedAt: minutesAgo(2), freshness: 'current', visibility: 'private', priority: 70, why: 'You marked it as an explicit priority and it is due today.' },
  { key: 'goals:goal_1', producer: 'goals', kind: 'action', title: 'Goal: pass the cognition exam', summary: 'Next action selected · milestone 2 of 4', resource: { owner: 'goals', kind: 'goal', id: 'goal_1' }, route: '/goals/goal_1', observedAt: minutesAgo(30), freshness: 'current', visibility: 'private', priority: 55, why: 'Active goal with a dated milestone in 9 days.' },
  { key: 'study:chk_3', producer: 'study', kind: 'learning', title: 'Resume: working memory', summary: 'Open question: is the episodic buffer a store or a process? · Baddeley p. 421', resource: { owner: 'study', kind: 'checkpoint', id: 'chk_3', revision: 2 }, route: '/learn/resume', observedAt: minutesAgo(1300), freshness: 'current', visibility: 'private', priority: 60, why: 'Your latest checkpoint; paused topics never become overdue.' },
  { key: 'reviews:due', producer: 'reviews', kind: 'learning', title: '12 reviews due', summary: 'Capped at 20 today · 3 topics', resource: { owner: 'reviews', kind: 'summary', id: 'today' }, route: '/learn/review', observedAt: minutesAgo(70), freshness: 'stale', visibility: 'private', priority: 45, why: 'Scheduler summary; cached because the producer was slow.' },
  { key: 'home:scenes', producer: 'home', kind: 'home', title: 'Living room · Evening', summary: '3 lights on · 21.5° · scene applied 19:02', resource: { owner: 'home', kind: 'room', id: 'room_living' }, route: '/home', observedAt: minutesAgo(1), freshness: 'current', visibility: 'display', priority: 50, why: 'Owner-supplied widget; controls call Home directly.' },
  { key: 'household:shopping', producer: 'household', kind: 'action', title: '4 items on the shopping list', summary: 'Oat milk, coffee filters, rice, dish soap', resource: { owner: 'household', kind: 'shopping_list', id: 'list_main' }, route: '/life/household/shopping', observedAt: minutesAgo(200), freshness: 'current', visibility: 'display', priority: 30, why: 'Optional completion summary from Household.' },
  { key: 'briefings:today', producer: 'briefings', kind: 'learning', title: 'Morning briefing ready', summary: '5 items · 2 sources muted · weather from Open-Meteo', resource: { owner: 'briefings', kind: 'briefing_snapshot', id: 'brf_today' }, route: '/briefing', observedAt: minutesAgo(400), freshness: 'current', visibility: 'private', priority: 35, why: 'Generated 08:05 within your 5-item budget.' },
]

export async function getToday(): Promise<Snapshot<TodayResponse>> {
  await wait(320)
  const activeDismissals = dismissals.filter((item) => new Date(item.until).getTime() > Date.now())
  const visible = contributions.filter((item) => !activeDismissals.some((dismissed) => dismissed.key === item.key))
  return snapshot({
    contributions: visible,
    producers: [
      { producer: 'home-alerts', status: 'ok', ms: 42 },
      { producer: 'calendar', status: 'ok', ms: 118 },
      { producer: 'tasks', status: 'ok', ms: 31 },
      { producer: 'goals', status: 'ok', ms: 44 },
      { producer: 'study', status: 'ok', ms: 63 },
      { producer: 'reviews', status: 'cached', ms: 2000, note: 'timed out at 2 s; cached contribution from 70 min ago shown' },
      { producer: 'home', status: 'ok', ms: 90 },
      { producer: 'household', status: 'ok', ms: 28 },
      { producer: 'briefings', status: 'ok', ms: 51 },
      { producer: 'training', status: 'disabled', note: 'capability not enabled' },
    ],
    layout,
    dismissals: activeDismissals,
    weather: { temperature: 23, unit: 'C', condition: 'Light cloud, soft light', high: 26, low: 17, observedAt: minutesAgo(25), source: 'Open-Meteo' },
    inboxCount: 4,
    limit: 6,
  })
}

export async function updateLayout(next: TodayLayout): Promise<Operation<TodayLayout>> {
  await wait(150)
  layout = next
  return completed(layout)
}

export async function pinReference(key: string, pinned: boolean): Promise<Operation<TodayLayout>> {
  await wait(120)
  layout = { ...layout, pinned: pinned ? Array.from(new Set([...layout.pinned, key])) : layout.pinned.filter((item) => item !== key) }
  return completed(layout)
}

export async function dismissContribution(key: string, period: 'hour' | 'today' | 'week'): Promise<Operation<Dismissal>> {
  await wait(120)
  const until = period === 'hour' ? hoursFromNow(1) : period === 'today' ? daysFromNow(1, 0) : daysFromNow(7, 0)
  const dismissal = { key, until }
  dismissals = [...dismissals.filter((item) => item.key !== key), dismissal]
  return completed(dismissal)
}

export async function restoreDismissed(key: string): Promise<Operation<void>> {
  await wait(80)
  dismissals = dismissals.filter((item) => item.key !== key)
  return completed(undefined)
}

export const kindOrderDefault: ContributionKind[] = ['exception', 'commitment', 'action', 'learning', 'home']

export function nowStamp() {
  return nowIso()
}
