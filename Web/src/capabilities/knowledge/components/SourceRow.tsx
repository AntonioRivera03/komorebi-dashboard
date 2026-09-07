import { Link } from 'react-router'
import { formatRelative } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import type { Source } from '../interfaces/types'
import { ExtractionBadge } from './ExtractionBadge'
import styles from '../knowledge.module.css'

export function SourceRow({ source }: { source: Source }) {
  const current = source.revisions.find((rev) => rev.revision === source.currentRevision)
  return (
    <Link to={`${routes.library}/${source.id}`} className={styles.sourceRow}>
      <span className={styles.kind} aria-hidden="true">
        {source.kind}
      </span>
      <div>
        <div className={styles.sourceTitle}>{source.title}</div>
        <div className={styles.sourceMeta}>
          {source.author ? <span>{source.author}</span> : null}
          <span>imported {formatRelative(source.importedAt)}</span>
          <span>rev {source.currentRevision}</span>
          {current?.chunkCount ? <span>{current.chunkCount} passages</span> : null}
          {source.topics.map((topic) => (
            <span key={topic}>#{topic}</span>
          ))}
        </div>
      </div>
      <ExtractionBadge state={source.state} />
    </Link>
  )
}
