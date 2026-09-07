import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { UsageObservation } from '../interfaces/types'
import styles from '../usage.module.css'

const tone = (kind: UsageObservation['kind']) => (kind === 'failure' ? 'danger' : kind === 'completion' || kind === 'acceptance' ? 'ok' : kind === 'dismissal' || kind === 'cancellation' ? 'warn' : 'neutral')

export function ObservationRow({ observation }: { observation: UsageObservation }) {
  return (
    <div className={styles.event}>
      <time dateTime={observation.at}>{formatRelative(observation.at)}</time>
      <div>
        <strong style={{ fontWeight: 500 }}>
          {observation.capability} · {observation.action}
        </strong>
        <small>
          {observation.correlationId}
          {observation.workflowId ? ` · ${observation.workflowId}` : ''} · release {observation.release}
          {observation.durationMs ? ` · ${observation.durationMs} ms` : ''}
          {observation.outcome ? ` · ${observation.outcome}` : ''}
        </small>
        {observation.route ? (
          <Link to={observation.route} className="k-ref" style={{ marginTop: 4 }}>
            {observation.resource}
          </Link>
        ) : null}
      </div>
      <StatusPill tone={tone(observation.kind)}>{observation.kind}</StatusPill>
    </div>
  )
}
