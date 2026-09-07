import { useState } from 'react'
import { Link } from 'react-router'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useTodayHome } from '../interfaces/useTodayHome'
import { DeviceSwitchRow } from './DeviceSwitchRow'
import { ThermostatDial } from './ThermostatDial'
import { SceneButtons } from './SceneButtons'
import styles from '../today.module.css'

/** Owner-supplied Home widget. Every control calls Home's own API; Today only lays it out. */
export function HomeWidget() {
  const home = useTodayHome()
  const toast = useToast()
  const [pendingDevice, setPendingDevice] = useState<string | null>(null)
  const [pendingScene, setPendingScene] = useState<string | null>(null)

  const onDevice = async (id: string, on: boolean) => {
    setPendingDevice(id)
    const result = await home.setDevice(id, on)
    setPendingDevice(null)
    if (result.status === 'failed') toast(result.message ?? 'Command failed', { tone: 'danger' })
  }

  const onScene = async (id: string, name: string) => {
    setPendingScene(id)
    const result = await home.applyScene(id)
    setPendingScene(null)
    if (result.status === 'completed') toast(result.value.result === 'partial' ? `Scene “${name}” applied partially · one device unavailable` : `Scene “${name}” confirmed`, { tone: result.value.result === 'partial' ? 'warn' : 'neutral' })
  }

  return (
    <Panel variant="filled" className="home" aria-label="Home controls">
      <PanelHead
        title="Living room"
        eyebrow="Home · owner widget"
        meta={
          <AsyncPanel query={home.query} skeletonLines={1}>
            {({ data }) => <StatusPill tone={data.connection === 'linked' ? 'ok' : 'warn'} live={data.connection === 'linked'}>{data.connection}</StatusPill>}
          </AsyncPanel>
        }
        actions={
          <Link to={routes.home} className="k-ref">
            all rooms →
          </Link>
        }
      />
      <AsyncPanel query={home.query} skeletonLines={5}>
        {({ data }) => (
          <>
            <div className={styles.homeMain}>
              <ThermostatDial temperature={data.temperature} setpoint={data.setpoint} onSetpoint={home.setSetpoint} />
              <div className={styles.homeControls}>
                {data.devices.map((device) => (
                  <DeviceSwitchRow key={device.id} device={device} pending={pendingDevice === device.id} onChange={(on) => onDevice(device.id, on)} />
                ))}
              </div>
            </div>
            <SceneButtons scenes={data.scenes} pendingId={pendingScene} onApply={onScene} />
          </>
        )}
      </AsyncPanel>
    </Panel>
  )
}
