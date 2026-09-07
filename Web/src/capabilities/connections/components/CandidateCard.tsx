import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { Select } from '../../../shared/ui/Select'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { routes } from '../../../shared/lib/routes'
import type { ConnectionCandidate } from '../interfaces/types'
import styles from '../connections.module.css'

type Props = { candidate: ConnectionCandidate; busy?: boolean; onDecide: (candidate: ConnectionCandidate, decision: 'accepted' | 'dismissed', relation?: ConnectionCandidate['relation']) => void }

export function CandidateCard({ candidate, busy, onDecide }: Props) {
  const [relation, setRelation] = useState(candidate.relation)
  const decided = candidate.status !== 'pending'
  return (
    <article className={styles.candidate} data-status={candidate.status}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={candidate.kind === 'analogy' ? 'warn' : 'accent'}>{candidate.kind}</StatusPill>
          <StatusPill tone={candidate.status === 'accepted' ? 'ok' : candidate.status === 'stale' ? 'danger' : 'neutral'} live={candidate.status === 'promoting'}>
            {candidate.status}
          </StatusPill>
        </div>
        <span className="muted small mono">run {candidate.runId}</span>
      </div>
      <div className={styles.pair}>
        <div className={styles.note}>
          <span className="label">from · r{candidate.from.revision}</span>
          <h4>
            <Link to={`${routes.notes}/${candidate.from.noteId}`}>{candidate.from.title}</Link>
          </h4>
          {candidate.from.excerpt ? <q>{candidate.from.excerpt}</q> : null}
        </div>
        <div className={styles.bridge}>
          <span>{decided ? candidate.relation : relation}</span>
          <i aria-hidden="true" />
        </div>
        <div className={styles.note}>
          <span className="label">to · r{candidate.to.revision}</span>
          <h4>
            <Link to={`${routes.notes}/${candidate.to.noteId}`}>{candidate.to.title}</Link>
          </h4>
          {candidate.to.excerpt ? <q>{candidate.to.excerpt}</q> : null}
        </div>
      </div>
      <p className={styles.explanation}>{candidate.explanation}</p>
      {candidate.evidence.length ? (
        <div className={styles.evidence}>
          {candidate.evidence.map((item) => (
            <span key={`${item.noteId}-${item.locator}`}>
              <b>
                {item.noteId} {item.locator}
              </b>
              {item.passage}
            </span>
          ))}
        </div>
      ) : null}
      <ul className={styles.limits}>
        {candidate.limitations.map((limit) => (
          <li key={limit}>{limit}</li>
        ))}
      </ul>
      {!decided ? (
        <div className="k-row k-row--between">
          <div className="k-row">
            <span className="label">relation</span>
            <Select value={relation} onChange={(event) => setRelation(event.target.value as ConnectionCandidate['relation'])} style={{ width: 'auto' }} options={[{ value: 'prerequisite', label: 'prerequisite' }, { value: 'example', label: 'example' }, { value: 'contrast', label: 'contrast' }, { value: 'related', label: 'related idea' }]} aria-label="Relation type" />
          </div>
          <div className="k-row">
            <Button variant="ghost" onClick={() => onDecide(candidate, 'dismissed')} disabled={busy}>
              Dismiss
            </Button>
            <Button variant="primary" busy={busy} onClick={() => onDecide(candidate, 'accepted', relation !== candidate.relation ? relation : undefined)}>
              {relation !== candidate.relation ? 'Accept as edited' : 'Accept'}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
