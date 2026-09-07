import type { WorkflowOutcome } from '../interfaces/types'
import styles from '../usage.module.css'

/** Aggregates carry denominators; a low count never means the feature lacks value. */
export function WorkflowTable({ workflows }: { workflows: WorkflowOutcome[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>workflow</th>
          <th>outcomes</th>
          <th style={{ textAlign: 'right' }}>started</th>
          <th style={{ textAlign: 'right' }}>done</th>
          <th style={{ textAlign: 'right' }}>median</th>
        </tr>
      </thead>
      <tbody>
        {workflows.map((row) => (
          <tr key={row.workflow}>
            <td>
              {row.workflow}
              <div className="muted small mono">{row.capability}</div>
            </td>
            <td>
              <div className={styles.funnel} title={`${row.completed} completed · ${row.abandoned} abandoned · ${row.failed} failed`}>
                <span data-part="completed" style={{ width: `${(row.completed / row.started) * 100}%` }} />
                <span data-part="abandoned" style={{ width: `${(row.abandoned / row.started) * 100}%` }} />
                <span data-part="failed" style={{ width: `${(row.failed / row.started) * 100}%` }} />
              </div>
            </td>
            <td className={styles.num}>{row.started}</td>
            <td className={styles.num}>{row.completed}</td>
            <td className={styles.num}>{row.medianSeconds !== undefined ? (row.medianSeconds >= 60 ? `${Math.round(row.medianSeconds / 60)} min` : `${row.medianSeconds} s`) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
