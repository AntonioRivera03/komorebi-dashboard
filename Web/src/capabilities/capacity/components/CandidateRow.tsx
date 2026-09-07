import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { Candidate } from '../interfaces/types'
import styles from '../capacity.module.css'

type Props = { candidate: Candidate; onDecide: (id: string, decision: 'accepted' | 'dismissed' | 'scheduled') => void }

export function CandidateRow({ candidate, onDecide }: Props) {
  return (
    <div className={styles.candidate} data-decision={candidate.decision}>
      <div className={styles.duration}>
        {candidate.minutes}
        <small>MIN · {candidate.effort}</small>
      </div>
      <div>
        <Link to={candidate.route} style={{ fontSize: 14, fontWeight: 500 }}>
          {candidate.title}
        </Link>
        <div className={styles.reasons}>
          <StatusPill tone="soft">{candidate.source}</StatusPill>
          {candidate.reasons.map((reason) => (
            <StatusPill key={reason}>{reason}</StatusPill>
          ))}
        </div>
        {candidate.aiNote ? <p className={styles.aiNote}>✦ {candidate.aiNote}</p> : null}
      </div>
      <div className="k-stack" style={{ gap: 6 }}>
        {candidate.decision ? (
          <StatusPill tone={candidate.decision === 'dismissed' ? 'neutral' : 'ok'}>{candidate.decision}</StatusPill>
        ) : (
          <>
            <Button size="sm" variant="primary" onClick={() => onDecide(candidate.id, 'accepted')}>
              Accept
            </Button>
            <Button size="sm" onClick={() => onDecide(candidate.id, 'scheduled')} icon="calendar">
              Propose block
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDecide(candidate.id, 'dismissed')}>
              Not now
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
