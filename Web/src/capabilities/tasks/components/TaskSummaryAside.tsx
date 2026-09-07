import { StatTile } from '../../../shared/ui/StatTile'
import { Notice } from '../../../shared/ui/Notice'
import { formatDuration } from '../../../shared/lib/format'
import type { Task } from '../interfaces/types'
import styles from '../tasks.module.css'

export function TaskSummaryAside({ tasks }: { tasks: Task[] }) {
  const open = tasks.filter((task) => task.status === 'open' || task.status === 'in_progress')
  const minutes = open.reduce((sum, task) => sum + (task.estimateMinutes ?? 0), 0)
  const overdue = open.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now()).length
  const priority = open.filter((task) => task.priority).length
  return (
    <aside className={styles.aside} aria-label="Task summary">
      <span className="label">In this view</span>
      <div className="k-stats">
        <StatTile value={open.length} label="open" />
        <StatTile value={minutes ? formatDuration(minutes) : '—'} label="estimated" />
        <StatTile value={overdue} label="overdue" />
        <StatTile value={priority} label="priority" />
      </div>
      <Notice glyph="↻">
        Recurring tasks generate occurrences within a bounded look-ahead. A missed occurrence stays missed; it is never reinterpreted as done.
      </Notice>
    </aside>
  )
}
