import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { routes } from '../../../shared/lib/routes'
import type { CalendarConnection } from '../interfaces/types'

type Props = { connection: CalendarConnection; onRefresh: () => void; refreshing?: boolean }

export function ConnectionStatusCard({ connection, onRefresh, refreshing }: Props) {
  return (
    <div className="k-row k-row--between">
      <div className="k-row">
        <StatusPill tone={connection.status === 'synced' ? 'ok' : connection.status === 'reconnect' ? 'danger' : 'warn'} live={connection.status === 'synced'}>
          {connection.provider} · {connection.status}
        </StatusPill>
        <StatusPill>{connection.mode === 'read' ? 'read-only' : 'read + reviewed writes'}</StatusPill>
        {connection.pendingOperations ? <StatusPill tone="warn">{connection.pendingOperations} pending op</StatusPill> : null}
        <FreshnessBadge freshness={connection.status === 'stale' ? 'stale' : 'current'} observedAt={connection.lastCursorAt} prefix="cursor" />
      </div>
      <div className="k-row">
        <Button size="sm" icon="refresh" onClick={onRefresh} busy={refreshing}>
          Refresh
        </Button>
        <Link to={routes.calendarConnections} className="k-ref">
          connections →
        </Link>
      </div>
    </div>
  )
}
