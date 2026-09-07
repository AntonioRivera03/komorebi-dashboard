import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { TextInput } from '../../../shared/ui/TextInput'
import { formatRelative } from '../../../shared/lib/format'
import type { MemoryItem } from '../interfaces/types'
import styles from '../memory.module.css'

type Props = { item: MemoryItem; busy?: boolean; onCorrect: (item: MemoryItem, statement: string) => void; onForget: (item: MemoryItem) => void; onConfirm: (item: MemoryItem) => void }

const typeLabel: Record<MemoryItem['type'], string> = { stated_fact: 'stated fact', stated_preference: 'stated preference', inferred_pattern: 'inferred pattern', working_summary: 'working summary' }

export function MemoryCard({ item, busy, onCorrect, onForget, onConfirm }: Props) {
  const [editing, setEditing] = useState(false)
  const [statement, setStatement] = useState(item.statement)
  const inactive = item.status === 'superseded' || item.status === 'suppressed'
  return (
    <article className={styles.item} data-status={item.status} data-type={item.type}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={item.type === 'inferred_pattern' ? 'warn' : item.type === 'working_summary' ? 'soft' : 'accent'}>{typeLabel[item.type]}</StatusPill>
          <StatusPill tone={item.provenance === 'explicit' ? 'ok' : item.provenance === 'confirmed' ? 'ok' : 'neutral'}>{item.provenance}</StatusPill>
          {item.status !== 'active' ? <StatusPill tone={item.status === 'conflicted' ? 'warn' : 'neutral'}>{item.status}</StatusPill> : null}
        </div>
        <span className="muted small mono">r{item.revision} · {item.extractorVersion}</span>
      </div>
      {editing ? (
        <div className="k-row">
          <TextInput value={statement} onChange={(event) => setStatement(event.target.value)} style={{ flex: 1 }} aria-label="Corrected statement" />
          <Button size="sm" variant="primary" busy={busy} onClick={() => { onCorrect(item, statement); setEditing(false) }}>
            Save correction
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <p className={styles.statement} data-strike={inactive}>
          {item.statement}
        </p>
      )}
      {item.confidence ? (
        <span className="muted small">
          {item.confidence.label} · {item.confidence.note}
        </span>
      ) : null}
      <div className={styles.meta}>
        <span>valid from {formatRelative(item.validFrom)}</span>
        {item.validTo ? <span>until {formatRelative(item.validTo)}</span> : null}
        {item.lastAppliedAt ? <span>last applied {formatRelative(item.lastAppliedAt)}</span> : <span>never applied</span>}
        <span>applied {item.appliedCount}×</span>
        {item.counts ? (
          <span>
            observed {item.counts.observed}× · {item.counts.window}
          </span>
        ) : null}
      </div>
      {item.conflict ? (
        <div className={styles.conflict}>
          <strong>Conflict:</strong> {item.conflict.with} {item.conflict.note}
        </div>
      ) : null}
      <div className={styles.evidence}>
        <span className="label">why it believes this</span>
        {item.evidence.map((evidence) => (
          <div key={evidence.id} className={styles.evidenceRow} data-valid={evidence.valid}>
            <StatusPill tone="soft">{evidence.kind}</StatusPill>
            <span>{evidence.excerpt}</span>
            {evidence.route && evidence.valid ? (
              <Link to={evidence.route} className="mono small">
                {evidence.ref} →
              </Link>
            ) : (
              <span className="mono small">{evidence.ref}</span>
            )}
          </div>
        ))}
      </div>
      {!inactive && !editing ? (
        <div className="k-row" style={{ justifyContent: 'flex-end' }}>
          {item.provenance === 'inferred' ? (
            <Button size="sm" variant="ghost" icon="check" onClick={() => onConfirm(item)}>
              That's right
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(true)}>
            Correct
          </Button>
          <Button size="sm" variant="danger" icon="trash" busy={busy} onClick={() => onForget(item)}>
            Forget
          </Button>
        </div>
      ) : null}
    </article>
  )
}
