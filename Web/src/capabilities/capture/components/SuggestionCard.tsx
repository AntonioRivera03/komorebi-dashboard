import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { CaptureItem, DestinationKind } from '../interfaces/types'
import styles from '../capture.module.css'

type Props = { item: CaptureItem; onAccept: (destination: DestinationKind) => void; onReject: () => void }

/** AI destination suggestion. Persisted with the user's decision; never converts on its own. */
export function SuggestionCard({ item, onAccept, onReject }: Props) {
  const suggestion = item.suggestion
  if (!suggestion) return null
  if ('status' in suggestion) {
    return (
      <div className={styles.suggestion}>
        <div className={styles.suggestionHead}>
          <span className="label">AI suggestion</span>
          {suggestion.status === 'pending' ? <StatusPill live>interpreting</StatusPill> : <StatusPill tone="danger">interrupted</StatusPill>}
        </div>
        <p className="muted small">{suggestion.status === 'pending' ? 'Reading the capture with your existing context. You can convert manually meanwhile.' : suggestion.error}</p>
      </div>
    )
  }
  return (
    <div className={styles.suggestion}>
      <div className={styles.suggestionHead}>
        <span className="label">AI suggestion · {suggestion.confidence} confidence</span>
        {suggestion.decision ? <StatusPill tone={suggestion.decision === 'rejected' ? 'neutral' : 'ok'}>{suggestion.decision}</StatusPill> : null}
      </div>
      <p style={{ fontSize: 13 }}>
        Make this a <strong>{suggestion.destination}</strong>: “{suggestion.title}”
      </p>
      <p className="muted small">{suggestion.reason}</p>
      {suggestion.candidateActions?.length ? (
        <ul className="muted small" style={{ margin: 0, paddingLeft: 16 }}>
          {suggestion.candidateActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      ) : null}
      {!suggestion.decision && item.state === 'unprocessed' ? (
        <div className="k-row">
          <Button size="sm" variant="primary" onClick={() => onAccept(suggestion.destination)}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject}>
            Not this
          </Button>
        </div>
      ) : null}
    </div>
  )
}
