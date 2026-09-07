import { Link } from 'react-router'
import { Icon } from '../../../shared/ui/Icon'
import type { EvidenceRef } from '../interfaces/types'
import styles from '../assistant.module.css'

export function EvidenceChip({ evidence }: { evidence: EvidenceRef }) {
  return (
    <Link to={evidence.route} className={styles.evidenceChip} title={`${evidence.resource.owner} · ${evidence.resource.kind} ${evidence.resource.id}${evidence.resource.revision ? ` r${evidence.resource.revision}` : ''}`}>
      <strong>
        <Icon name="quote" size={11} />
        {evidence.label}
        {evidence.locator ? <span className="mono muted" style={{ fontWeight: 400 }}>{evidence.locator}</span> : null}
      </strong>
      <q>{evidence.excerpt}</q>
    </Link>
  )
}
