import type { TaskChange } from '../interfaces/types'
import styles from '../tasks.module.css'

export function TaskHistory({ history }: { history: TaskChange[] }) {
  if (history.length === 0) return <p className="muted small">No recorded changes.</p>
  return (
    <ol className={styles.history}>
      {history.map((change) => (
        <li key={change.id}>
          <time dateTime={change.at}>{new Date(change.at).toLocaleString()}</time>
          <span className="mono small" style={{ marginRight: 8, color: 'var(--accent)' }}>
            {change.kind}
          </span>
          {change.detail}
        </li>
      ))}
    </ol>
  )
}
