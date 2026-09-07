import type { ResourceRef } from '../../../shared/contracts/common'

export type EffortPreference = 'any' | 'light' | 'medium' | 'deep'

export type PlanningInput = {
  availableMinutes: number
  effort: EffortPreference
  includeLearning: boolean
  includeAdmin: boolean
}

export type Candidate = {
  id: string
  resource: ResourceRef
  title: string
  minutes: number
  effort: 'light' | 'medium' | 'deep'
  source: 'tasks' | 'study' | 'reviews'
  reasons: string[]
  route: string
  aiNote?: string
  decision?: 'accepted' | 'dismissed' | 'scheduled'
}

export type PlanningSession = {
  id: string
  input: PlanningInput
  candidates: Candidate[]
  bufferMinutes: number
  calendarFreshness: 'current' | 'stale'
  excluded: { title: string; reason: string }[]
  createdAt: string
}
