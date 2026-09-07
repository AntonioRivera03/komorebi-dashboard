import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { Notice } from '../../../shared/ui/Notice'
import { previewScene } from '../interfaces/homeApi'
import type { Scene } from '../interfaces/types'
import { DeviceStatusPill } from './DeviceStatusPill'
import styles from '../home.module.css'

type Props = { scene: Scene | null; busy?: boolean; onApply: (scene: Scene) => void; onClose: () => void }

export function ScenePreviewDialog({ scene, busy, onApply, onClose }: Props) {
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewScene>> | null>(null)
  useEffect(() => {
    setPreview(null)
    if (!scene) return
    let active = true
    previewScene(scene.id).then((result) => active && setPreview(result))
    return () => {
      active = false
    }
  }, [scene])
  const unavailable = preview?.data.predicted.filter((item) => item.status === 'unavailable').length ?? 0
  return (
    <Dialog
      open={scene !== null}
      onClose={onClose}
      eyebrow={scene ? `Scene · ${scene.name} · r${scene.revision}` : ''}
      title="What will change"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!preview} onClick={() => scene && onApply(scene)}>
            Apply scene
          </Button>
        </>
      }
    >
      {!preview ? (
        <Skeleton lines={3} />
      ) : (
        <>
          {preview.data.predicted.map((item) => (
            <div key={item.deviceName} className={styles.preview}>
              <strong style={{ fontWeight: 500 }}>{item.deviceName}</strong>
              <span className="mono muted">{item.from}</span>
              <span>
                <span className={styles.arrow}>→ </span>
                {item.to}
              </span>
              <DeviceStatusPill status={item.status} observedAt={new Date().toISOString()} />
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            {unavailable > 0 ? <Notice tone="warn" glyph="!">{unavailable} target{unavailable === 1 ? ' is' : 's are'} unavailable. Expect a partial result; each device reports its own outcome and there is no global rollback.</Notice> : <Notice tone="ok" glyph="✓">All targets are reachable. Results are still reported per device.</Notice>}
          </div>
        </>
      )}
    </Dialog>
  )
}
