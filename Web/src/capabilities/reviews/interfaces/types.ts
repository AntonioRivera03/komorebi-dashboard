export type DueItem = {
  enrollmentId: string
  promptId: string
  question: string
  topic: string
  dueAt: string
  why: string
  stability: number
  lastRating?: 'again' | 'hard' | 'good' | 'easy'
  overdueDays: number
}

export type TopicState = { topic: string; enrolled: number; due: number; paused: boolean }

export type SchedulerProfile = { algorithm: string; version: string; dailyCap: number; newCap: number; retention: number }

export type ReviewSummary = { due: DueItem[]; topics: TopicState[]; profile: SchedulerProfile; workloadForecast: number[]; retentionTradeoff: { retention: number; reviewsPerDay: number }[] }
