import { Switch } from '../../../shared/ui/Switch'
import { formatRelative } from '../../../shared/lib/format'
import type { TodayDevice } from '../interfaces/useTodayHome'
import styles from '../today.module.css'

type Props = { device: TodayDevice; pending: boolean; onChange: (on: boolean) => void }

const statusCopy = { available: '', stale: ' · stale', unavailable: ' · unavailable', unknown: ' · unknown' }

export function DeviceSwitchRow({ device, pending, onChange }: Props) {
  return (
    <div className={styles.device}>
      <div>
        {device.name}
        <small>
          {device.room} · observed {formatRelative(device.observedAt)}
          {statusCopy[device.status]}
        </small>
      </div>
      <Switch label={device.name} checked={device.on} pending={pending} disabled={device.status === 'unavailable'} onChange={onChange} />
    </div>
  )
}
