import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import type { StudySession } from '../interfaces/types'
import styles from '../study.module.css'

export function SessionRow({ session }: { session: StudySession }) {
  const attempted = session.items.filter((item) => item.attemptIds.length > 0).length
  return (
    <Link to={`${routes.practice}/${session.id}`} className={styles.sessionRow}>
      <div>
        <strong>{session.title}</strong>
        <small>
          {session.kind} · {attempted}/{session.items.length} answered · {formatRelative(session.startedAt)}
          {session.sourceTitle ? ` · ${session.sourceTitle}` : ''}
          {session.originRef ? ` · via ${session.originRef.owner}` : ''}
        </small>
      </div>
      <StatusPill tone={session.status === 'active' ? 'accent' : session.status === 'paused' ? 'warn' : 'neutral'} live={session.status === 'active'}>
        {session.status}
      </StatusPill>
    </Link>
  )
}
