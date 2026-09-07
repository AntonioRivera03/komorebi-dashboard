import { Checkbox } from '../../../shared/ui/Checkbox'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatDuration, formatRelative } from '../../../shared/lib/format'
import type { Task } from '../interfaces/types'
import { EffortMeter } from './EffortMeter'
import styles from '../tasks.module.css'

type Props = {
  task: Task
  selected?: boolean
  busy?: boolean
  onOpen: (task: Task) => void
  onToggle: (task: Task) => void
}

export function TaskRow({ task, selected, busy, onOpen, onToggle }: Props) {
  const done = task.status === 'completed'
  const overdue = !done && task.status !== 'canceled' && task.dueAt ? new Date(task.dueAt).getTime() < Date.now() : false
  return (
    <div className={styles.row} data-selected={selected} role="button" tabIndex={0} onClick={() => onOpen(task)} onKeyDown={(event) => event.key === 'Enter' && onOpen(task)}>
      <Checkbox
        checked={done}
        disabled={busy || task.status === 'canceled'}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggle(task)}
      />
      <div className={styles.title}>
        <strong data-done={done}>
          {task.priority ? (
            <span className={styles.priority} aria-label="Priority">
              ✦
            </span>
          ) : null}
          {task.title}
        </strong>
        <span className={styles.meta} data-overdue={overdue}>
          {task.dueAt ? <span className={styles.due}>{overdue ? 'overdue · ' : 'due '}{formatRelative(task.dueAt)}</span> : <span>undated</span>}
          {task.estimateMinutes ? <span>{formatDuration(task.estimateMinutes)}</span> : null}
          {task.context ? <span>#{task.context}</span> : null}
          {task.seriesId ? <span>↻ recurring</span> : null}
        </span>
      </div>
      <div className={styles.end}>
        <EffortMeter effort={task.effort} />
        {task.status === 'in_progress' ? <StatusPill tone="accent">in progress</StatusPill> : null}
        {task.status === 'canceled' ? <StatusPill>canceled</StatusPill> : null}
        {task.originRef ? <StatusPill tone="soft" title={`Requested by ${task.originRef.owner}`}>{task.originRef.owner}</StatusPill> : null}
      </div>
    </div>
  )
}
