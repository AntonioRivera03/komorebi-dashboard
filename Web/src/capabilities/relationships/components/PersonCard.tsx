import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { TextArea } from '../../../shared/ui/TextArea'
import { daysUntil, formatMonthDay, formatRelative } from '../../../shared/lib/format'
import type { Person } from '../interfaces/types'
import styles from '../relationships.module.css'

type Props = { person: Person; onSaveNote: (person: Person, note: string) => void }

export function PersonCard({ person, onSaveNote }: Props) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(person.note ?? '')
  return (
    <article className={styles.person}>
      <div className="k-row k-row--between">
        <h3>{person.name}</h3>
        {person.reminder ? <StatusPill tone="soft">{person.reminder.cadence} · next {formatRelative(person.reminder.nextAt)}</StatusPill> : <StatusPill>no reminder</StatusPill>}
      </div>
      {editing ? (
        <div className="k-stack">
          <TextArea rows={3} value={note} onChange={(event) => setNote(event.target.value)} aria-label="Private note" />
          <div className="k-row">
            <Button size="sm" variant="primary" onClick={() => { onSaveNote(person, note); setEditing(false) }}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.note} onClick={() => setEditing(true)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setEditing(true)}>
          {person.note ?? 'Add a private note…'}
        </div>
      )}
      <div>
        {person.dates.map((date) => (
          <div key={date.id} className={styles.dateRow}>
            <span>
              {date.label}
              {date.annual ? <span className="muted small"> · yearly{date.leapPolicy ? ` · leap → ${date.leapPolicy}` : ''}</span> : null}
            </span>
            <span className="mono small">
              {formatMonthDay(date.date)} · {daysUntil(date.date)}d
            </span>
          </div>
        ))}
      </div>
      <span className="muted small">Private notes are never copied into calendar descriptions by default and are excluded from shared screens.</span>
    </article>
  )
}
