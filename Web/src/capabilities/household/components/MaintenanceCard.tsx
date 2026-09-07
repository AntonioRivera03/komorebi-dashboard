import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { ResourceChip } from '../../../shared/ui/ResourceChip'
import { Switch } from '../../../shared/ui/Switch'
import { daysUntil, formatRelative } from '../../../shared/lib/format'
import type { MaintenanceTemplate } from '../interfaces/types'
import styles from '../household.module.css'

type Props = { template: MaintenanceTemplate; busy?: boolean; onComplete: (template: MaintenanceTemplate) => void; onPause: (template: MaintenanceTemplate, paused: boolean) => void }

export function MaintenanceCard({ template, busy, onComplete, onPause }: Props) {
  const days = template.nextTask ? daysUntil(template.nextTask.dueAt) : null
  return (
    <article className={styles.template} data-paused={template.paused}>
      <div className="k-row k-row--between">
        <StatusPill tone={template.cadence.mode === 'calendar' ? 'neutral' : 'accent'}>{template.cadence.mode === 'calendar' ? template.cadence.rule : `${template.cadence.days} days after completion`}</StatusPill>
        <Switch label={`${template.paused ? 'Resume' : 'Pause'} ${template.title}`} checked={!template.paused} onChange={(active) => onPause(template, !active)} />
      </div>
      <h3>{template.title}</h3>
      <p>{template.instructions}</p>
      {template.linkedAsset ? (
        <span className={`k-ref ${template.linkedAsset.available ? '' : 'k-ref--broken'}`}>
          <span className="k-ref__owner">{template.linkedAsset.kind}</span> · {template.linkedAsset.label}
        </span>
      ) : null}
      <div className="k-row k-row--between">
        {template.nextTask && !template.paused ? (
          <div className={styles.due}>
            {days !== null && days < 0 ? `${-days}d overdue` : days === 0 ? 'today' : `${days}d`}
            <small>NEXT</small>
          </div>
        ) : (
          <span className="muted small">{template.paused ? 'Paused · no new occurrences; history kept' : 'No next occurrence'}</span>
        )}
        <div className="k-row">
          {template.nextTask ? <ResourceChip resource={template.nextTask.ref} to={`/tasks/${template.nextTask.ref.id}`} label={`task ${template.nextTask.ref.id}`} /> : null}
          <Button size="sm" variant="primary" icon="check" busy={busy} disabled={template.paused} onClick={() => onComplete(template)}>
            Done
          </Button>
        </div>
      </div>
      {template.lastCompletedAt ? <span className="muted small mono">last completed {formatRelative(template.lastCompletedAt)} · r{template.revision} · {template.history.length} in history</span> : null}
    </article>
  )
}
