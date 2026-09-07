import { completed, daysFromNow, failedOperation, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ReviewSummary, SchedulerProfile } from './types'

/* Reviews HTTP adapter (mock): /api/v1/reviews/... AI never chooses an interval. */

let profile: SchedulerProfile = { algorithm: 'FSRS', version: '4.5', dailyCap: 20, newCap: 5, retention: 0.9 }
let paused: string[] = ['japanese']

const dueItems = [
  { enrollmentId: 'en_1', promptId: 'prm_loop', question: 'Name the two components of the phonological loop.', topic: 'working memory', dueAt: daysFromNow(-2), why: 'Last rated good 6 days ago; stability 5.1 days; retention now below 90%.', stability: 5.1, lastRating: 'good' as const, overdueDays: 2 },
  { enrollmentId: 'en_2', promptId: 'prm_ce', question: 'What does the central executive do, and what does it not do?', topic: 'working memory', dueAt: daysFromNow(0), why: 'Rated again last time (hint used); short interval scheduled.', stability: 1.2, lastRating: 'again' as const, overdueDays: 0 },
  { enrollmentId: 'en_3', promptId: 'prm_load', question: 'What does perceptual load theory predict for distractor processing under high load?', topic: 'attention', dueAt: daysFromNow(0), why: 'First review after enrollment.', stability: 0.8, overdueDays: 0 },
  { enrollmentId: 'en_4', promptId: 'prm_menu', question: 'A waiter approaches. Get their attention and ask for the menu.', topic: 'japanese', dueAt: daysFromNow(-1), why: 'Topic paused; shown for transparency, not counted.', stability: 3.0, lastRating: 'hard' as const, overdueDays: 1 },
]

export async function getReviewSummary(): Promise<Snapshot<ReviewSummary>> {
  await wait(300)
  return snapshot({
    due: dueItems.map((item) => ({ ...item, dueAt: item.dueAt })),
    topics: [
      { topic: 'working memory', enrolled: 9, due: 8, paused: paused.includes('working memory') },
      { topic: 'attention', enrolled: 4, due: 3, paused: paused.includes('attention') },
      { topic: 'japanese', enrolled: 12, due: 1, paused: paused.includes('japanese') },
    ],
    profile,
    workloadForecast: [12, 15, 9, 18, 22, 14, 11, 16, 20, 13, 9, 17, 19, 12],
    retentionTradeoff: [
      { retention: 0.8, reviewsPerDay: 9 },
      { retention: 0.85, reviewsPerDay: 12 },
      { retention: 0.9, reviewsPerDay: 16 },
      { retention: 0.95, reviewsPerDay: 27 },
    ],
  })
}

export async function updateProfile(patch: Partial<SchedulerProfile>): Promise<Operation<SchedulerProfile>> {
  await wait(200)
  profile = { ...profile, ...patch }
  return completed(profile)
}

export async function pauseTopic(topic: string, pause: boolean): Promise<Operation<string[]>> {
  await wait(160)
  paused = pause ? Array.from(new Set([...paused, topic])) : paused.filter((item) => item !== topic)
  return completed(paused)
}

export async function startReviewSession(enrollmentIds: string[]): Promise<Operation<{ sessionId: string }>> {
  await wait(400)
  if (enrollmentIds.length === 0) return failedOperation('validation', false, 'Nothing due within the cap.')
  return completed({ sessionId: 'ses_2' })
}
