/*
 * Browser-visible shapes mirrored from the specification's contract document.
 * These will be replaced by generated OpenAPI types once the server publishes them.
 */
export type ResourceRef = {
  owner: string
  kind: string
  id: string
  revision?: number
}

export type Freshness = 'current' | 'stale' | 'unknown'

export type Snapshot<T> = {
  data: T
  observedAt: string
  freshness: Freshness
  sourceRevision?: string
}

export type Operation<T> =
  | { status: 'completed'; value: T }
  | { status: 'pending'; operationId: string; pollUrl: string }
  | { status: 'failed'; code: string; retryable: boolean; message?: string }

export type Principal = 'user' | 'display' | 'automation' | 'job'
