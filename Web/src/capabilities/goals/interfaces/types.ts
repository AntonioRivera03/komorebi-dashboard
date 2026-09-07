import type { ResourceRef } from '../../../shared/contracts/common'

export type GoalStatus = 'active' | 'paused' | 'achieved' | 'archived'
export type ActionState = 'no_next_action' | 'next_action_selected' | 'waiting' | 'paused' | 'completed'

export type Milestone = { id: string; title: string; order: number; targetDate?: string; done: boolean }

export type LinkedAction = {
  id: string
  taskRef: ResourceRef
  title: string
  status: 'open' | 'in_progress' | 'completed' | 'unavailable'
  isNext: boolean
  observedAt: string
}

export type EvidenceLink = {
  id: string
  resource: ResourceRef
  label: string
  note: string
  kind: 'automatic' | 'declared'
  refreshedAt: string
  available: boolean
}

export type Goal = {
  id: string
  title: string
  purpose: string
  outcome: string
  targetDate?: string
  status: GoalStatus
  actionState: ActionState
  evidenceDefinition: string
  milestones: Milestone[]
  actions: LinkedAction[]
  evidence: EvidenceLink[]
  achievedDeclaredAt?: string
  revision: number
  updatedAt: string
}

export type GoalDraft = { title: string; purpose: string; outcome: string; targetDate?: string; evidenceDefinition: string }

export type BreakdownSuggestion = {
  id: string
  kind: 'milestone' | 'task'
  title: string
  rationale: string
  decision?: 'accepted' | 'rejected'
}
