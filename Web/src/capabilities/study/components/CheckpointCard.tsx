import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { Checkpoint } from '../interfaces/types'
import styles from '../study.module.css'

type Props = { checkpoint: Checkpoint; onResume: (checkpoint: Checkpoint) => void; onResolve: (checkpoint: Checkpoint) => void; onPause: (checkpoint: Checkpoint) => void; busy?: boolean }

export function CheckpointCard({ checkpoint, onResume, onResolve, onPause, busy }: Props) {
  return (
    <article className={styles.checkpointCard} data-status={checkpoint.status}>
      <div className="k-row k-row--between">
        <StatusPill tone={checkpoint.status === 'open' ? 'accent' : 'neutral'}>{checkpoint.status}</StatusPill>
        <span className="mono small muted">
          r{checkpoint.revision} · {checkpoint.generatedBy === 'ai' ? 'AI draft, edited' : 'yours'} · {formatRelative(checkpoint.updatedAt)}
        </span>
      </div>
      <h3>{checkpoint.topic}</h3>
      <div className={styles.checkpointField}>
        <b>understood</b>
        <span>{checkpoint.understood}</span>
      </div>
      <div className={styles.checkpointField}>
        <b>open question</b>
        <span>{checkpoint.openQuestion}</span>
      </div>
      <div className={styles.checkpointField}>
        <b>next step</b>
        <span>{checkpoint.nextStep}</span>
      </div>
      <div className="k-row">
        {checkpoint.sourceRefs.map((ref) =>
          ref.available ? (
            <Link key={ref.locator} to={ref.route} className="k-ref">
              <span className="k-ref__owner">{ref.sourceTitle}</span> · {ref.locator}
            </Link>
          ) : (
            <span key={ref.locator} className="k-ref k-ref--broken">
              {ref.sourceTitle} · {ref.locator}
            </span>
          ),
        )}
      </div>
      <div className="k-row k-row--between" style={{ marginTop: 4 }}>
        <div className="k-row">
          <Button size="sm" variant="ghost" onClick={() => onResolve(checkpoint)}>
            Resolved
          </Button>
          {checkpoint.status === 'open' ? (
            <Button size="sm" variant="ghost" onClick={() => onPause(checkpoint)}>
              Pause
            </Button>
          ) : null}
        </div>
        <Button size="sm" variant="primary" icon="play" onClick={() => onResume(checkpoint)} busy={busy}>
          Resume with a fresh session
        </Button>
      </div>
    </article>
  )
}
