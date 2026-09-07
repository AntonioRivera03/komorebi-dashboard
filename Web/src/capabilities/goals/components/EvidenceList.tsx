import { ResourceChip } from '../../../shared/ui/ResourceChip'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { EvidenceLink } from '../interfaces/types'
import styles from '../goals.module.css'

export function EvidenceList({ evidence }: { evidence: EvidenceLink[] }) {
  if (evidence.length === 0) return <p className="muted small">No evidence collected yet. Evidence is collected automatically from linked records; it never declares the goal achieved.</p>
  return (
    <div className="k-stack">
      {evidence.map((item) => (
        <div key={item.id} className={styles.evidence} data-available={item.available}>
          <div className="k-row k-row--between">
            <strong style={{ fontWeight: 500 }}>{item.label}</strong>
            <StatusPill tone={item.kind === 'declared' ? 'accent' : 'neutral'}>{item.kind}</StatusPill>
          </div>
          <span className="muted small">{item.note}</span>
          <div className="k-row">
            <ResourceChip resource={item.resource} broken={!item.available} />
            <span className="muted small mono">refreshed {formatRelative(item.refreshedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
