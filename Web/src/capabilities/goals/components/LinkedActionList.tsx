import { Button } from '../../../shared/ui/Button'
import { ResourceChip } from '../../../shared/ui/ResourceChip'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { LinkedAction } from '../interfaces/types'
import styles from '../goals.module.css'

type Props = { actions: LinkedAction[]; onSetNext: (id: string) => void }

/** Task references are owned by Tasks; a deleted task shows as unavailable, never deletes the goal. */
export function LinkedActionList({ actions, onSetNext }: Props) {
  if (actions.length === 0) return <p className="muted small">No linked actions. Accept a suggestion or link a task to give this goal a next step.</p>
  return (
    <div>
      {actions.map((action) => (
        <div key={action.id} className={styles.action} data-unavailable={action.status === 'unavailable'}>
          <div className="k-stack" style={{ gap: 4 }}>
            <span>
              {action.isNext ? <StatusPill tone="accent">next</StatusPill> : null} {action.title}
            </span>
            <ResourceChip resource={action.taskRef} to={action.status === 'unavailable' ? undefined : `/tasks/${action.taskRef.id}`} broken={action.status === 'unavailable'} label={`task ${action.taskRef.id}`} />
          </div>
          <div className="k-row">
            <StatusPill tone={action.status === 'completed' ? 'ok' : action.status === 'unavailable' ? 'danger' : 'neutral'}>{action.status.replace('_', ' ')}</StatusPill>
            {!action.isNext && action.status !== 'unavailable' && action.status !== 'completed' ? (
              <Button size="sm" variant="ghost" onClick={() => onSetNext(action.id)}>
                Make next
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
