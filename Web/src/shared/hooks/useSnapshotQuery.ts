import { useCallback, useEffect, useRef, useState } from 'react'
import type { Snapshot } from '../contracts/common'

export type QueryState<T> =
  | { status: 'loading'; snapshot?: Snapshot<T> }
  | { status: 'ready'; snapshot: Snapshot<T> }
  | { status: 'error'; message: string; snapshot?: Snapshot<T> }

export type SnapshotQuery<T> = QueryState<T> & {
  reload: () => void
  /** Optimistically replace the local data while keeping observedAt/freshness. */
  mutate: (updater: (current: T) => T) => void
}

/**
 * Loads a capability snapshot with loading / ready / error states.
 * `key` should be module-prefixed (for example `tasks:list:open`) so caches
 * stay scoped per capability as the spec requires.
 */
export function useSnapshotQuery<T>(key: string, loader: () => Promise<Snapshot<T>>): SnapshotQuery<T> {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' })
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setState((current) => ({ status: 'loading', snapshot: current.snapshot }))
    loaderRef
      .current()
      .then((snapshot) => {
        if (active) setState({ status: 'ready', snapshot })
      })
      .catch((error: unknown) => {
        if (active) {
          setState((current) => ({
            status: 'error',
            message: error instanceof Error ? error.message : 'Request failed',
            snapshot: current.snapshot,
          }))
        }
      })
    return () => {
      active = false
    }
  }, [key, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const mutate = useCallback((updater: (current: T) => T) => {
    setState((current) => {
      if (!current.snapshot) return current
      return { ...current, snapshot: { ...current.snapshot, data: updater(current.snapshot.data) } }
    })
  }, [])

  return { ...state, reload, mutate }
}
