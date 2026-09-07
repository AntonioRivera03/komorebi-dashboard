import type { ResourceRef } from '../../../shared/contracts/common'

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'canceled'
export type Effort = 'light' | 'medium' | 'deep'

export type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  dueAt?: string
  estimateMinutes?: number
  effort?: Effort
  context?: string
  priority: boolean
  seriesId?: string
  occurrenceKey?: string
  originRef?: ResourceRef
  revision: number
  createdAt: string
  completedAt?: string
  archived?: boolean
}

export type TaskSeries = {
  id: string
  title: string
  rule: string
  lookaheadDays: number
}

export type TaskChange = {
  id: string
  taskId: string
  at: string
  kind: 'created' | 'updated' | 'completed' | 'reopened' | 'canceled' | 'prioritized'
  detail: string
}

export type TaskDraft = {
  title: string
  description?: string
  dueAt?: string
  estimateMinutes?: number
  effort?: Effort
  context?: string
  priority?: boolean
  recurrence?: string
}

export type TaskFilter = {
  status: 'open' | 'in_progress' | 'completed' | 'all'
  context?: string
  due?: 'today' | 'week' | 'overdue' | 'any'
}

export type SeriesEditScope = 'occurrence' | 'series'
