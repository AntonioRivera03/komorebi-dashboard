import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { Scene } from '../interfaces/types'
import styles from '../home.module.css'

type Props = { scene: Scene; roomName: string; onPreview: (scene: Scene) => void; onEdit: (scene: Scene) => void; busy?: boolean }

export function SceneCard({ scene, roomName, onPreview, onEdit, busy }: Props) {
  return (
    <article className={styles.sceneCard} data-repair={Boolean(scene.needsRepair)}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={scene.origin === 'provider' ? 'neutral' : 'accent'}>{scene.origin === 'provider' ? 'imported' : 'komorebi'}</StatusPill>
          <span className="muted small mono">
            {roomName} · r{scene.revision}
          </span>
        </div>
        {scene.exposedTo.length ? <span className="muted small mono">exposed to {scene.exposedTo.join(', ')}</span> : null}
      </div>
      <h3>{scene.name}</h3>
      <ul className={styles.targets}>
        {scene.targets.map((target) => (
          <li key={`${target.deviceId}-${target.action}`}>
            <b>{target.deviceName}</b>
            <span>
              {target.action} → {target.value}
            </span>
          </li>
        ))}
      </ul>
      {scene.needsRepair ? <span className="small" style={{ color: 'var(--danger)' }}>{scene.needsRepair}</span> : null}
      <div className="k-row k-row--between" style={{ marginTop: 4 }}>
        <Button size="sm" variant="ghost" icon="edit" onClick={() => onEdit(scene)} disabled={scene.origin === 'provider'}>
          {scene.needsRepair ? 'Repair' : 'Edit'}
        </Button>
        <Button size="sm" variant="primary" icon="play" onClick={() => onPreview(scene)} busy={busy} disabled={Boolean(scene.needsRepair)}>
          Preview and apply
        </Button>
      </div>
    </article>
  )
}
