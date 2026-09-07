import { useState } from 'react'
import { IconButton } from '../../../shared/ui/IconButton'
import styles from '../today.module.css'

type Props = { temperature: number; setpoint: number; onSetpoint: (value: number) => Promise<unknown> }

export function ThermostatDial({ temperature, setpoint, onSetpoint }: Props) {
  const [local, setLocal] = useState(setpoint)
  const commit = (value: number) => {
    const next = Math.max(15, Math.min(28, value))
    setLocal(next)
    onSetpoint(next)
  }
  return (
    <div>
      <div className={styles.temperature} style={{ transform: `rotate(${(local - 21) * 6}deg)` }} aria-label={`Room ${temperature} degrees, setpoint ${local}`}>
        <div style={{ transform: `rotate(${-(local - 21) * 6}deg)`, textAlign: 'center' }}>
          <strong>{temperature.toFixed(1)}°</strong>
          <span>set {local}°</span>
        </div>
      </div>
      <div className={styles.climate}>
        <IconButton size="sm" icon="minus" label="Lower setpoint" onClick={() => commit(local - 0.5)} />
        <input type="range" min={15} max={28} step={0.5} value={local} onChange={(event) => setLocal(Number(event.target.value))} onMouseUp={() => commit(local)} onTouchEnd={() => commit(local)} onKeyUp={() => commit(local)} aria-label="Setpoint" />
        <IconButton size="sm" icon="plus" label="Raise setpoint" onClick={() => commit(local + 0.5)} />
      </div>
    </div>
  )
}
