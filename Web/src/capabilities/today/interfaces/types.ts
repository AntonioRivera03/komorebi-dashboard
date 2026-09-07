import type { Freshness, ResourceRef } from '../../../shared/contracts/common'

export type ContributionKind = 'commitment' | 'action' | 'learning' | 'home' | 'exception'

/** Mirrors the TodayContribution contract from the spec (I01). */
export type TodayContribution = {
  key: string
  producer: string
  kind: ContributionKind
  title: string
  summary?: string
  resource: ResourceRef
  route: string
  observedAt: string
  expiresAt?: string
  freshness: Freshness
  visibility: 'private' | 'display'
  priority: number
  /** Optional producer-supplied detail used by the card's explain popover. */
  why?: string
  meta?: string
}

export type ProducerStatus = { producer: string; status: 'ok' | 'timeout' | 'failed' | 'disabled' | 'cached'; ms?: number; note?: string }

export type TodayLayout = {
  pinned: string[]
  order: ContributionKind[]
  hidden: ContributionKind[]
}

export type Dismissal = { key: string; until: string }

export type TodayWeather = { temperature: number; unit: 'C' | 'F'; condition: string; high: number; low: number; observedAt: string; source: string } | null

export type TodayResponse = {
  contributions: TodayContribution[]
  producers: ProducerStatus[]
  layout: TodayLayout
  dismissals: Dismissal[]
  weather: TodayWeather
  inboxCount: number
  limit: number
}
