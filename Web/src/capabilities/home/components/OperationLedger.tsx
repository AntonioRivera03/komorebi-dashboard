import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { DeviceOperation } from '../interfaces/types'
import styles from '../home.module.css'

const tone = (state: DeviceOperation['state']) => (state === 'confirmed' ? 'ok' : state === 'failed' ? 'danger' : ['timed_out', 'unknown_outcome', 'partial'].includes(state) ? 'warn' : 'neutral')

/** Command ledger: expired actuator commands are never replayed on reconnect. */
export function OperationLedger({ operations }: { operations: DeviceOperation[] }) {
  if (operations.length === 0) return <p className="muted small">No commands yet.</p>
  return (
    <div>
      {operations.map((op) => (
        <div key={op.id} className={styles.opRow}>
          <div>
            <strong style={{ fontWeight: 500 }}>
              {op.deviceName} · {op.action}
            </strong>
            <small>
              {op.detail} · {formatRelative(op.startedAt)}
            </small>
          </div>
          <StatusPill tone={tone(op.state)}>{op.state.replace('_', ' ')}</StatusPill>
        </div>
      ))}
    </div>
  )
}
