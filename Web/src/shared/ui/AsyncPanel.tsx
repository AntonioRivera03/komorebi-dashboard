import type { ReactNode } from 'react'
import type { QueryState } from '../hooks/useSnapshotQuery'
import type { Snapshot } from '../contracts/common'
import { Button } from './Button'
import { Skeleton } from './Skeleton'

type Props<T> = {
  query: QueryState<T> & { reload: () => void }
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  skeletonLines?: number
  children: (snapshot: Snapshot<T>) => ReactNode
}

/**
 * Renders loading, error, empty and ready states for a snapshot query.
 * A stale-but-present snapshot is still rendered while a reload runs, so the
 * page never blanks because one producer is slow.
 */
export function AsyncPanel<T>({ query, isEmpty, empty, skeletonLines = 3, children }: Props<T>) {
  if (query.status === 'loading' && !query.snapshot) return <Skeleton lines={skeletonLines} />
  if (query.status === 'error' && !query.snapshot) {
    return (
      <div className="k-error" role="alert">
        <span>{query.message}</span>
        <Button size="sm" onClick={query.reload} icon="refresh">
          Retry
        </Button>
      </div>
    )
  }
  const snapshot = query.snapshot as Snapshot<T>
  if (isEmpty?.(snapshot.data)) return <>{empty}</>
  return <>{children(snapshot)}</>
}
