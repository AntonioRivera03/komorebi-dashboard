import { useState } from 'react'
import { Switch } from '../../../shared/ui/Switch'
import { LifecycleTrail } from '../../../shared/ui/LifecycleTrail'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import type { CommandState, Device } from '../interfaces/types'
import { DeviceStatusPill } from './DeviceStatusPill'
import styles from '../home.module.css'

type Props = { device: Device; onCommand: (device: Device, patch: Device['state'], onProgress: (state: CommandState) => void) => Promise<void> }

const icons: Record<Device['kind'], IconName> = { light: 'lamp', switch: 'lamp', climate: 'thermometer', sensor: 'eye' }
const steps = [
  { id: 'queued', label: 'queued' },
  { id: 'sent', label: 'sent' },
  { id: 'acknowledged', label: 'acknowledged' },
  { id: 'confirmed', label: 'confirmed' },
]

/** Each command shows request accepted, provider acknowledgement and confirmed observed state separately. */
export function DeviceCard({ device, onCommand }: Props) {
  const [command, setCommand] = useState<CommandState | null>(null)
  const [brightness, setBrightness] = useState(device.state.brightness ?? 0)
  const busy = command !== null && !['confirmed', 'failed', 'unknown_outcome', 'timed_out'].includes(command)
  const controllable = device.status !== 'unavailable' && device.supportedActions.length > 0

  const run = async (patch: Device['state']) => {
    setCommand('queued')
    await onCommand(device, patch, setCommand)
    window.setTimeout(() => setCommand(null), 4000)
  }

  return (
    <article className={styles.device} data-status={device.status}>
      <div className={styles.deviceHead}>
        <span className={styles.deviceName}>
          <i>
            <Icon name={icons[device.kind]} size={14} />
          </i>
          {device.name}
        </span>
        {device.supportedActions.includes('toggle') ? <Switch label={device.name} checked={Boolean(device.state.on)} disabled={!controllable || busy} pending={busy} onChange={(on) => run({ on })} /> : null}
      </div>
      {device.kind === 'climate' ? (
        <div className="k-row" style={{ gap: 16 }}>
          <div className={styles.dial}>
            <strong>{device.state.current?.toFixed(1)}°</strong>
            <span>set {device.state.setpoint}°</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.control}>
              <span>setpoint</span>
              <input type="range" min={15} max={28} step={0.5} defaultValue={device.state.setpoint} onMouseUp={(event) => run({ setpoint: Number((event.target as HTMLInputElement).value) })} onTouchEnd={(event) => run({ setpoint: Number((event.target as HTMLInputElement).value) })} onKeyUp={(event) => event.key.startsWith('Arrow') && run({ setpoint: Number((event.target as HTMLInputElement).value) })} aria-label="Setpoint" disabled={!controllable || busy} />
            </div>
            <span className="muted small mono">humidity {device.state.humidity}%</span>
          </div>
        </div>
      ) : null}
      {device.kind === 'sensor' ? (
        <div className={styles.reading}>
          {device.state.current !== undefined ? `${device.state.current.toFixed(1)}°` : device.state.value}
          {device.state.humidity !== undefined ? <small>{device.state.humidity}% RH</small> : null}
          {device.status === 'unknown' ? <small>no recent observation</small> : null}
        </div>
      ) : null}
      {device.supportedActions.includes('brightness') ? (
        <div className={styles.control}>
          <span>{brightness}%</span>
          <input type="range" min={1} max={100} value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} onMouseUp={() => run({ brightness, on: true })} onTouchEnd={() => run({ brightness, on: true })} aria-label={`${device.name} brightness`} disabled={!controllable || busy} />
        </div>
      ) : null}
      {device.supportedActions.includes('colorTemp') ? (
        <div className={styles.tempChips} role="group" aria-label="Colour temperature">
          {(['warm', 'neutral', 'cool'] as const).map((temp) => (
            <button key={temp} type="button" aria-pressed={device.state.colorTemp === temp} onClick={() => run({ colorTemp: temp, on: true })} disabled={!controllable || busy}>
              {temp}
            </button>
          ))}
        </div>
      ) : null}
      <div className="k-row k-row--between">
        <DeviceStatusPill status={device.status} observedAt={device.observedAt} />
        <span className="muted small mono">rev {device.revision}</span>
      </div>
      {command ? <LifecycleTrail steps={steps} current={command} exception={['failed', 'unknown_outcome', 'timed_out', 'partial'].includes(command) ? { label: command.replace('_', ' '), tone: command === 'failed' ? 'failed' : 'warn' } : undefined} /> : null}
    </article>
  )
}
