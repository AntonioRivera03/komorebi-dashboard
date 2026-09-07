import { Link } from 'react-router'
import { LifecycleTrail } from '../../../shared/ui/LifecycleTrail'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { RoutedOperation } from '../interfaces/types'
import styles from '../voice.module.css'

const steps = [
  { id: 'accepted', label: 'accepted' },
  { id: 'acknowledged', label: 'acknowledged' },
  { id: 'confirmed', label: 'confirmed' },
]

export function RoutedOperationCard({ routed }: { routed: RoutedOperation }) {
  return (
    <div className={styles.routed}>
      <div className="k-row k-row--between">
        <span className="label">routed to {routed.target}</span>
        <StatusPill tone={routed.status === 'failed' ? 'danger' : routed.status === 'needs_confirmation' ? 'warn' : 'ok'}>{routed.status.replace('_', ' ')}</StatusPill>
      </div>
      <strong style={{ fontSize: 13, fontWeight: 500 }}>{routed.label}</strong>
      {routed.status === 'needs_confirmation' ? (
        <p className="muted small">Open-ended requests are handed to the assistant, which previews any change before it runs.</p>
      ) : (
        <LifecycleTrail steps={steps} current={routed.status} exception={routed.status === 'failed' ? { label: 'failed', tone: 'failed' } : undefined} />
      )}
      {routed.route ? (
        <Link to={routed.route} className="k-ref">
          open {routed.target} →
        </Link>
      ) : null}
    </div>
  )
}
