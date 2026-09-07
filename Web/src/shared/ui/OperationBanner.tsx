import type { OperationState } from '../hooks/useOperation'
import { Button } from './Button'
import { Notice } from './Notice'

type Props<T> = { state: OperationState<T>; onRetry?: () => void; pendingText?: string }

/** Shows a command's result honestly: pending work is tracked, failure is retryable or not. */
export function OperationBanner<T>({ state, onRetry, pendingText = 'Tracked operation in progress. The result will be shown once the owner confirms it.' }: Props<T>) {
  if (state.phase === 'pending') {
    return (
      <Notice tone="warn" glyph="…">
        {pendingText} <span className="mono small">#{state.operationId}</span>
      </Notice>
    )
  }
  if (state.phase === 'failed') {
    return (
      <Notice tone="danger" glyph="!">
        <div className="k-row k-row--between">
          <span>
            {state.message ?? 'The command failed.'} <span className="mono small">({state.code})</span>
          </span>
          {state.retryable && onRetry ? (
            <Button size="sm" onClick={onRetry} icon="refresh">
              Retry
            </Button>
          ) : null}
        </div>
      </Notice>
    )
  }
  return null
}
