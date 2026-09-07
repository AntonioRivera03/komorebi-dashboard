import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { routes } from '../../../shared/lib/routes'
import type { NoteRelation } from '../interfaces/types'
import styles from '../knowledge.module.css'

export function RelationList({ relations }: { relations: NoteRelation[] }) {
  if (relations.length === 0) return <p className="muted small">No typed relationships yet.</p>
  return (
    <div>
      {relations.map((relation) => (
        <div key={relation.id} className={styles.relation}>
          <StatusPill tone={relation.origin === 'connections' ? 'accent' : 'neutral'} title={relation.origin === 'connections' ? 'Accepted from a Connections suggestion' : 'Created manually'}>
            {relation.type}
          </StatusPill>
          <div>
            <Link to={`${routes.notes}/${relation.targetId}`} style={{ fontWeight: 500 }}>
              {relation.targetTitle}
            </Link>
            <small>{relation.why}</small>
          </div>
        </div>
      ))}
    </div>
  )
}
