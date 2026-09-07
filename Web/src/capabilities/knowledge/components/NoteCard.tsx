import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Tag } from '../../../shared/ui/Tag'
import { formatRelative } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import type { ConceptNote } from '../interfaces/types'
import styles from '../knowledge.module.css'

export function NoteCard({ note }: { note: ConceptNote }) {
  return (
    <Link to={`${routes.notes}/${note.id}`} className={styles.noteCard}>
      <div className="k-row k-row--between">
        <div className="k-row" style={{ gap: 4 }}>
          {note.topics.slice(0, 3).map((topic) => (
            <Tag key={topic}>{topic}</Tag>
          ))}
        </div>
        {note.status !== 'active' ? <StatusPill>{note.status}</StatusPill> : null}
      </div>
      <h3>{note.title}</h3>
      <p className={styles.noteBody}>{note.body}</p>
      <div className={styles.noteFoot}>
        <span>
          {note.sourceLinks.length} sources · {note.relations.length} links{note.openQuestions.length ? ` · ${note.openQuestions.length} open` : ''}
        </span>
        <span>
          r{note.revision} · {formatRelative(note.updatedAt)}
        </span>
      </div>
    </Link>
  )
}
