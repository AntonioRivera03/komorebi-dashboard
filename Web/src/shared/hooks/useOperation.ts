import { useCallback, useState } from 'react'
import type { Operation } from '../contracts/common'

export type OperationState<T> =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'completed'; value: T }
  | { phase: 'pending'; operationId: string }
  | { phase: 'failed'; code: string; retryable: boolean; message?: string }

/**
 * Wraps a capability command that returns an `Operation<T>`. The command result
 * is represented honestly: completed, tracked-pending or failed, never assumed.
 */
export function useOperation<Args extends unknown[], T>(command: (...args: Args) => Promise<Operation<T>>) {
  const [state, setState] = useState<OperationState<T>>({ phase: 'idle' })

  const run = useCallback(
    async (...args: Args): Promise<Operation<T>> => {
      setState({ phase: 'running' })
      try {
        const result = await command(...args)
        if (result.status === 'completed') setState({ phase: 'completed', value: result.value })
        else if (result.status === 'pending') setState({ phase: 'pending', operationId: result.operationId })
        else setState({ phase: 'failed', code: result.code, retryable: result.retryable, message: result.message })
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Command failed'
        setState({ phase: 'failed', code: 'transport_error', retryable: true, message })
        return { status: 'failed', code: 'transport_error', retryable: true, message }
      }
    },
    [command],
  )

  const reset = useCallback(() => setState({ phase: 'idle' }), [])

  return { state, run, reset, busy: state.phase === 'running' }
}
