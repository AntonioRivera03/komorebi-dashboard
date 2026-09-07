import type { TodayScene } from '../interfaces/useTodayHome'
import styles from '../today.module.css'

type Props = { scenes: TodayScene[]; pendingId: string | null; onApply: (id: string, name: string) => void }

export function SceneButtons({ scenes, pendingId, onApply }: Props) {
  return (
    <div className={styles.scenes} role="group" aria-label="Scenes">
      {scenes.map((scene) => (
        <button key={scene.id} type="button" className={styles.scene} aria-pressed={scene.active} data-busy={pendingId === scene.id} onClick={() => onApply(scene.id, scene.name)} disabled={pendingId !== null}>
          {scene.name}
        </button>
      ))}
    </div>
  )
}
