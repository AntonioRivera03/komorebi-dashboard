import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useRooms } from '../interfaces/useRooms'
import { useHomeConnection } from '../interfaces/useHomeConnection'
import { useDeviceOperations } from '../interfaces/useDeviceOperations'
import { setDeviceState } from '../interfaces/homeApi'
import type { CommandState, Device } from '../interfaces/types'
import { DeviceCard } from '../components/DeviceCard'
import { OperationLedger } from '../components/OperationLedger'
import { RoomTabs } from '../components/RoomTabs'
import styles from '../home.module.css'

export default function HomePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const rooms = useRooms()
  const connection = useHomeConnection()
  const operations = useDeviceOperations()
  const toast = useToast()
  const [ledgerOpen, setLedgerOpen] = useState(false)

  const command = async (device: Device, patch: Device['state'], onProgress: (state: CommandState) => void) => {
    const result = await setDeviceState(device.id, patch, onProgress)
    if (result.status === 'completed') {
      rooms.mutate((data) => ({ ...data, devices: data.devices.map((item) => (item.id === device.id ? result.value : item)) }))
    } else if (result.status === 'pending') {
      toast(`${device.name}: acknowledged, awaiting observed state`, { tone: 'warn' })
    } else {
      toast(result.message ?? 'Command failed', { tone: 'danger' })
    }
    operations.reload()
  }

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Home · H01"
        title="Rooms"
        subtitle="Control what the adapter reports as supported and see what actually responded. A command is accepted, acknowledged and then confirmed from observed state, never assumed."
        actions={
          <>
            <AsyncPanel query={connection} skeletonLines={1}>
              {({ data }) => (
                <Link to={routes.homeConnections}>
                  <StatusPill tone={data.status === 'linked' ? 'ok' : data.status === 'stale' ? 'warn' : 'danger'} live={data.status === 'linked'}>
                    Home Assistant · {data.status} · {data.permittedEntities}/{data.totalEntities} entities
                  </StatusPill>
                </Link>
              )}
            </AsyncPanel>
            <Button icon="clock" onClick={() => setLedgerOpen(true)}>
              Command ledger
            </Button>
            <Link to={routes.scenes}>
              <Button variant="primary" icon="sparkle">
                Scenes
              </Button>
            </Link>
          </>
        }
      />
      <AsyncPanel query={rooms} skeletonLines={8}>
        {(snapshot) => {
          const activeRoom = id ?? null
          const visible = snapshot.data.devices.filter((device) => !activeRoom || device.roomId === activeRoom)
          const counts = Object.fromEntries(snapshot.data.rooms.map((room) => [room.id, snapshot.data.devices.filter((device) => device.roomId === room.id && device.status !== 'available').length]))
          return (
            <>
              <RoomTabs rooms={snapshot.data.rooms} activeId={activeRoom} counts={counts} onSelect={(roomId) => navigate(roomId ? `${routes.home}/rooms/${roomId}` : routes.home)} />
              <div className="k-row k-row--between" style={{ marginBottom: 12 }}>
                <span className="label">{visible.length} devices · badges count devices not currently available</span>
                <FreshnessBadge freshness={snapshot.freshness} observedAt={snapshot.observedAt} prefix="mirror" />
              </div>
              <div className={styles.grid}>
                {visible.map((device) => (
                  <DeviceCard key={device.id} device={device} onCommand={command} />
                ))}
              </div>
            </>
          )
        }}
      </AsyncPanel>
      <Panel>
        <PanelHead title="Boundary" eyebrow="Why this page is honest" />
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
          Lights, safe switches and climate setpoints are the initial supported types; locks are excluded until an explicit action policy exists. The browser never sees a raw Home Assistant service call. Disconnects mark state stale or unavailable and block false confirmation. Expired commands are never replayed on reconnect.
        </p>
      </Panel>
      <SidePanel open={ledgerOpen} onClose={() => setLedgerOpen(false)} eyebrow="Home · device_operation" title="Command ledger">
        <AsyncPanel query={operations} skeletonLines={3}>
          {({ data }) => <OperationLedger operations={data} />}
        </AsyncPanel>
      </SidePanel>
    </div>
  )
}
