import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { PairedDevice } from '../interfaces/types'
import styles from '../settings.module.css'

type Props = { device: PairedDevice; onRevoke: (device: PairedDevice) => void }

export function DeviceRow({ device, onRevoke }: Props) {
  return (
    <div className={styles.provider}>
      <div>
        <strong style={{ fontWeight: 500 }}>{device.name}</strong>
        <small>
          {device.role} · scopes {device.scopes.join(', ')} · seen {formatRelative(device.lastSeen)}
        </small>
      </div>
      <div className="k-row">
        <StatusPill tone={device.role === 'owner' ? 'accent' : 'neutral'}>{device.role}</StatusPill>
        {device.role !== 'owner' ? (
          <Button size="sm" variant="danger" onClick={() => onRevoke(device)}>
            Revoke
          </Button>
        ) : null}
      </div>
    </div>
  )
}
