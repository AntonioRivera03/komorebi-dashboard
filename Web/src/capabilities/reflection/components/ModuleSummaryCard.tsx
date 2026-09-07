import { Checkbox } from '../../../shared/ui/Checkbox'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { ModuleSummary } from '../interfaces/types'
import styles from '../reflection.module.css'

type Props = { summary: ModuleSummary; selected: boolean; onToggle: () => void }

/** Coverage is explicit: missing data is labelled, never read as "no activity". */
export function ModuleSummaryCard({ summary, selected, onToggle }: Props) {
  return (
    <label className={styles.summary} data-coverage={summary.coverage} style={{ cursor: 'pointer' }}>
      <div className="k-row k-row--between">
        <span className="k-row">
          <Checkbox checked={selected} onChange={onToggle} disabled={summary.coverage === 'unavailable'} />
          <strong style={{ fontWeight: 500 }}>{summary.module}</strong>
        </span>
        <StatusPill tone={summary.coverage === 'complete' ? 'ok' : summary.coverage === 'partial' ? 'warn' : 'neutral'}>{summary.coverage}</StatusPill>
      </div>
      <ul>
        {summary.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <span className="muted small mono">fresh {formatRelative(summary.freshness)}</span>
    </label>
  )
}
