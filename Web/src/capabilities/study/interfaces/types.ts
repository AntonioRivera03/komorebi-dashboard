import type { ResourceRef } from '../../../shared/contracts/common'

export type ActivityKind = 'recall' | 'explanation' | 'problem' | 'communication'
export type PromptStatus = 'draft' | 'approved' | 'flagged' | 'retired'
export type Assistance = 'independent' | 'hint' | 'reference'
export type AssessmentProvenance = 'self' | 'deterministic' | 'ai_draft' | 'human_reviewed'

export type Prompt = {
  id: string
  revision: number
  status: PromptStatus
  kind: ActivityKind
  question: string
  referenceAnswer?: string
  sourceRefs: { sourceId: string; sourceTitle: string; locator: string; revision: number }[]
  generatedBy?: 'ai' | 'user'
  flaggedReason?: string
}

export type Assessment = {
  id: string
  provenance: AssessmentProvenance
  score?: number
  maxScore: number
  feedback?: string
  citedLocators?: string[]
  at: string
  state?: 'pending' | 'failed' | 'completed'
  error?: string
}

export type Attempt = {
  id: string
  promptId: string
  promptRevision: number
  answer: string
  assistance: Assistance
  submittedAt: string
  assessments: Assessment[]
}

export type SessionItem = { promptId: string; promptRevision: number; attemptIds: string[] }

export type StudySession = {
  id: string
  title: string
  kind: ActivityKind
  status: 'active' | 'paused' | 'ended'
  startedAt: string
  endedAt?: string
  originRef?: ResourceRef
  sourceTitle?: string
  items: SessionItem[]
  conversationId?: string
}

export type Checkpoint = {
  id: string
  sessionId: string
  topic: string
  understood: string
  openQuestion: string
  nextStep: string
  sourceRefs: { sourceTitle: string; locator: string; route: string; available: boolean }[]
  status: 'open' | 'resolved' | 'paused'
  revision: number
  updatedAt: string
  generatedBy?: 'ai' | 'user'
}
