import type { ResourceRef } from '../../../shared/contracts/common'

export type EvidenceRef = {
  id: string
  resource: ResourceRef
  label: string
  excerpt: string
  route: string
  locator?: string
}

export type ProposalStatus = 'draft' | 'ready_for_review' | 'confirmed' | 'executing' | 'completed' | 'expired' | 'superseded' | 'failed' | 'unknown_outcome'

export type ActionProposal = {
  id: string
  version: number
  tool: string
  toolVersion: string
  classification: 'read' | 'write'
  preview: string
  args: Record<string, string>
  requiredScopes: string[]
  sourceRevisions: ResourceRef[]
  status: ProposalStatus
  expiresAt: string
  resultRoute?: string
  resultLabel?: string
}

export type RunState = 'completed' | 'interrupted' | 'failed' | 'connection_needed' | 'streaming'

export type ChatMessage = {
  id: string
  clientMessageId?: string
  role: 'user' | 'assistant' | 'system'
  text: string
  at: string
  evidence?: EvidenceRef[]
  limitation?: string
  proposal?: ActionProposal
  runState?: RunState
  toolCalls?: { tool: string; classification: 'read' | 'write'; summary: string }[]
  originCapability?: string
}

export type ThreadSummary = {
  id: string
  title: string
  originCapability: string
  updatedAt: string
  messageCount: number
  archived?: boolean
}

export type RegisteredTool = {
  name: string
  owner: string
  classification: 'read' | 'write'
  confirmation: 'none' | 'preview'
  scope: string
  description: string
}
