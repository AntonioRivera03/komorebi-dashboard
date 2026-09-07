import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { DeviceStatus } from '../interfaces/types'

const tone: Record<DeviceStatus, 'ok' | 'warn' | 'danger' | 'neutral'> = { available: 'ok', stale: 'warn', unavailable: 'danger', unknown: 'neutral' }

export function DeviceStatusPill({ status, observedAt }: { status: DeviceStatus; observedAt: string }) {
  return (
    <StatusPill tone={tone[status]} dot title={`Last observation ${new Date(observedAt).toLocaleString()}`}>
      {status} · {formatRelative(observedAt)}
    </StatusPill>
  )
}
