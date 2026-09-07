import type { ResourceRef } from '../../../shared/contracts/common'

export type ShoppingItem = { id: string; listId: string; name: string; quantity: string; purchased: boolean; repeat: boolean; revision: number; addedVia: 'typed' | 'voice' | 'capture' }
export type ShoppingList = { id: string; name: string; scope: 'personal' | 'household' }

export type MaintenanceTemplate = {
  id: string
  title: string
  instructions: string
  cadence: { mode: 'calendar'; rule: string } | { mode: 'completion_relative'; days: number }
  linkedAsset?: { kind: 'room' | 'device' | 'document'; label: string; available: boolean }
  paused: boolean
  nextTask?: { ref: ResourceRef; dueAt: string; state: 'open' | 'completed' }
  lastCompletedAt?: string
  history: { at: string; note: string }[]
  revision: number
}

export type ShoppingParseDraft = { name: string; quantity: string }
