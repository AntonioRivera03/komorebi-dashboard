import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { formatRelative } from '../../../shared/lib/format'
import { useHomeConnection } from '../interfaces/useHomeConnection'
import { useRooms } from '../interfaces/useRooms'
import { reconnect } from '../interfaces/homeApi'
import { DeviceStatusPill } from '../components/DeviceStatusPill'
import styles from '../home.module.css'

export default function HomeConnectionsPage() {
  const connection = useHomeConnection()
  const rooms = useRooms()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  return (
    <div className="k-page">
      <PageHeader
        back={{ to: routes.home, label: 'Rooms' }}
        eyebrow="Home · connection"
        title="Home Assistant"
        subtitle="Server-side adapter. Only the entities you permit are mirrored, and only the state Komorebi needs."
        actions={
          <Button
            icon="refresh"
            busy={busy}
            onClick={async () => {
              setBusy(true)
              const result = await reconnect()
              setBusy(false)
              if (result.status === 'completed') {
                connection.mutate(() => result.value)
                rooms.reload()
                toast('Snapshot reconciled · subscription live · no queued commands replayed')
              }
            }}
          >
            Reconcile snapshot
          </Button>
        }
      />
      <div className="k-grid k-grid--2">
        <Panel flush>
          <PanelHead title="Connection" />
          <AsyncPanel query={connection} skeletonLines={5}>
            {({ data }) => (
              <dl style={{ margin: 0 }}>
                <div className={styles.connRow}>
                  <dt>Endpoint</dt>
                  <dd className="mono">{data.endpoint}</dd>
                </div>
                <div className={styles.connRow}>
                  <dt>Status</dt>
                  <dd>
                    <StatusPill tone={data.status === 'linked' ? 'ok' : 'warn'} live>
                      {data.status}
                    </StatusPill>
                  </dd>
                </div>
                <div className={styles.connRow}>
                  <dt>Subscription</dt>
                  <dd>
                    {data.subscription} · leased by <span className="mono">{data.leasedWorker}</span>
                  </dd>
                </div>
                <div className={styles.connRow}>
                  <dt>Snapshot reconciled</dt>
                  <dd>{formatRelative(data.snapshotReconciledAt)}</dd>
                </div>
                <div className={styles.connRow}>
                  <dt>Entities</dt>
                  <dd>
                    {data.permittedEntities} permitted of {data.totalEntities} discovered
                  </dd>
                </div>
                <div className={styles.connRow}>
                  <dt>Credential</dt>
                  <dd className="mono">secret ref · never sent to the browser</dd>
                </div>
              </dl>
            )}
          </AsyncPanel>
          <div style={{ marginTop: 16 }}>
            <Notice glyph="⛨">One leased worker owns the live subscription at a time. After a disconnect, the initial snapshot plus subscription must converge before any state is shown as current.</Notice>
          </div>
        </Panel>
        <Panel flush>
          <PanelHead title="Permitted entities" eyebrow="Komorebi IDs, typed actions" />
          <AsyncPanel query={rooms} skeletonLines={6}>
            {({ data }) =>
              data.devices.map((device) => (
                <div key={device.id} className="k-list-row">
                  <div className="k-list-row__main">
                    <strong>{device.name}</strong>
                    <small>
                      {data.rooms.find((room) => room.id === device.roomId)?.name} · {device.kind} · {device.supportedActions.length ? device.supportedActions.join(', ') : 'read-only'}
                    </small>
                  </div>
                  <DeviceStatusPill status={device.status} observedAt={device.observedAt} />
                </div>
              ))
            }
          </AsyncPanel>
        </Panel>
      </div>
    </div>
  )
}
