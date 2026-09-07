import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { SourceRevision } from '../interfaces/types'
import styles from '../knowledge.module.css'

export function RevisionList({ revisions }: { revisions: SourceRevision[] }) {
  return (
    <div>
      {[...revisions].reverse().map((rev) => (
        <div key={rev.revision} className={styles.revision} data-superseded={rev.superseded}>
          <span className="mono">r{rev.revision}</span>
          <span>
            {rev.method} · {rev.chunkCount} passages · {formatRelative(rev.createdAt)}
          </span>
          {rev.superseded ? <StatusPill>superseded</StatusPill> : <StatusPill tone="accent">current</StatusPill>}
        </div>
      ))}
      <p className="muted small" style={{ marginTop: 8 }}>
        Old attempts keep the revision they used. Superseded passages remain resolvable for history.
      </p>
    </div>
  )
}
