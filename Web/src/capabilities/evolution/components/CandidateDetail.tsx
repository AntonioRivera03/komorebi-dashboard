import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { TextInput } from '../../../shared/ui/TextInput'
import type { ImprovementCandidate } from '../interfaces/types'
import styles from '../evolution.module.css'

type Props = { candidate: ImprovementCandidate; busy?: boolean; onEvaluate: (candidate: ImprovementCandidate) => void; onDecide: (candidate: ImprovementCandidate, decision: 'accepted' | 'rejected', note: string) => void }

const authorityCopy = { assistance_auto: 'Personal-assistance change within current authority', requires_approval: 'Application behaviour or UI change · requires your approval', pending_brief: 'Change type awaits the completed brief · evidence only' }

export function CandidateDetail({ candidate, busy, onEvaluate, onDecide }: Props) {
  const [note, setNote] = useState('')
  const open = candidate.status === 'proposed' || candidate.status === 'evaluating'
  return (
    <div>
      <div className="k-row" style={{ marginBottom: 8 }}>
        <StatusPill tone={candidate.authority === 'assistance_auto' ? 'ok' : candidate.authority === 'pending_brief' ? 'warn' : 'accent'}>{authorityCopy[candidate.authority]}</StatusPill>
      </div>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>{candidate.title}</h2>
      <div className={styles.section}>
        <b>problem</b>
        <span>{candidate.problem}</span>
      </div>
      <div className={styles.section}>
        <b>hypothesis</b>
        <span>{candidate.hypothesis}</span>
      </div>
      <div className={styles.section}>
        <b>expected benefit · measurement</b>
        <span>{candidate.expectedBenefit}</span>
        <span className="muted">{candidate.measurement}</span>
        {candidate.rollback ? <span className="muted">rollback: {candidate.rollback}</span> : null}
      </div>
      <div className={styles.section}>
        <b>evidence</b>
        <div className={styles.evidence}>
          {candidate.evidence.map((item) => (
            item.route ? (
              <Link key={item.ref} to={item.route}>
                <code>{item.kind}</code>
                {item.excerpt} <span className="muted mono small">· {item.ref}</span>
              </Link>
            ) : (
              <span key={item.ref}>
                <code>{item.kind}</code>
                {item.excerpt}
              </span>
            )
          ))}
        </div>
      </div>
      {candidate.evaluation ? (
        <div className={styles.section}>
          <b>evaluation · {new Date(candidate.evaluation.at).toLocaleString()}</b>
          {candidate.evaluation.criteria.map((criterion) => (
            <div key={criterion.name} className={styles.criterion}>
              <span>
                {criterion.name}
                <small>baseline {criterion.baseline}</small>
              </span>
              <span className="mono small">{criterion.result ?? '—'}</span>
              <StatusPill tone={criterion.met === true ? 'ok' : criterion.met === false ? 'danger' : 'neutral'}>{criterion.met === true ? 'met' : criterion.met === false ? 'not met' : 'pending'}</StatusPill>
            </div>
          ))}
          <span className="muted">{candidate.evaluation.note}</span>
        </div>
      ) : null}
      {candidate.decision ? (
        <div className={styles.section}>
          <b>decision · {candidate.decision.by} · {new Date(candidate.decision.at).toLocaleDateString()}</b>
          <span>“{candidate.decision.note}”</span>
        </div>
      ) : null}
      {candidate.outcome ? (
        <div className={styles.outcome}>
          <div>
            <b>baseline</b>
            {candidate.outcome.baseline}
          </div>
          <div>
            <b>observed · {candidate.outcome.window}</b>
            {candidate.outcome.observed}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <b>conclusion</b>
            {candidate.outcome.conclusion}
          </div>
        </div>
      ) : null}
      {open ? (
        <div className="k-stack" style={{ marginTop: 16 }}>
          {candidate.authority === 'pending_brief' ? <Notice tone="warn" glyph="!">Automatic change authority for this type is unresolved. The evidence is recorded; nothing executes until the brief defines the policy.</Notice> : null}
          <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder="Your note on this decision" aria-label="Decision note" />
          <div className="k-row" style={{ justifyContent: 'flex-end' }}>
            {!candidate.evaluation ? (
              <Button icon="eye" busy={busy} onClick={() => onEvaluate(candidate)}>
                Evaluate
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => onDecide(candidate, 'rejected', note)}>
              Reject
            </Button>
            <Button variant="primary" busy={busy} onClick={() => onDecide(candidate, 'accepted', note)}>
              Accept
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
