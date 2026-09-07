import type { ResourceRef } from '../../../shared/contracts/common'

export type BlockLifecycle = 'proposed' | 'confirmed' | 'queued' | 'sending' | 'synced' | 'conflict' | 'failed' | 'unknown_outcome' | 'canceled'

export type AgendaItem = {
  id: string
  kind: 'provider' | 'block'
  title: string
  start: string
  end: string
  allDay?: boolean
  calendar?: string
  location?: string
  taskRef?: ResourceRef
  lifecycle?: BlockLifecycle
  timeZone: string
  recurring?: boolean
  providerRevision?: string
  conflict?: string
}

export type CalendarConnection = {
  id: string
  provider: string
  account: string
  mode: 'read' | 'read_write'
  status: 'synced' | 'stale' | 'reconnect' | 'paused'
  lastCursorAt: string
  pendingOperations: number
  calendars: { id: string; name: string; color: string; enabled: boolean }[]
}

export type ProviderOperation = {
  id: string
  blockId: string
  title: string
  state: BlockLifecycle
  startedAt: string
  detail: string
}

export type BlockProposal = {
  id: string
  taskRef: ResourceRef
  taskTitle: string
  start: string
  end: string
  timeZone: string
  conflicts: { with: string; overlapMinutes: number }[]
  alternatives: { start: string; end: string; reason: string }[]
}
