import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { ImprovementCandidate } from '../interfaces/types'
import styles from '../evolution.module.css'

type Props = { candidate: ImprovementCandidate; active: boolean; onSelect: (id: string) => void }

const statusTone = (status: ImprovementCandidate['status']) => (status === 'applied' || status === 'measured' || status === 'accepted' ? 'ok' : status === 'rejected' ? 'neutral' : status === 'evaluating' ? 'warn' : 'accent')

export function CandidateCard({ candidate, active, onSelect }: Props) {
  return (
    <button type="button" className={styles.card} aria-current={active} onClick={() => onSelect(candidate.id)}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={statusTone(candidate.status)}>{candidate.status}</StatusPill>
          <StatusPill tone="soft">{candidate.changeType}</StatusPill>
        </div>
        <span className="muted small mono">{formatRelative(candidate.createdAt)}</span>
      </div>
      <h3>{candidate.title}</h3>
      <p>{candidate.problem}</p>
      <span className="muted small mono">affects {candidate.affected.join(', ')} · {candidate.evidence.length} evidence</span>
    </button>
  )
}
