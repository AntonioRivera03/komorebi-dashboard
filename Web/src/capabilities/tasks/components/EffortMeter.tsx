import type { Effort } from '../interfaces/types'
import styles from '../tasks.module.css'

const levels: Record<Effort, number> = { light: 1, medium: 2, deep: 3 }

export function EffortMeter({ effort }: { effort?: Effort }) {
  if (!effort) return null
  const level = levels[effort]
  return (
    <span className={styles.effort} title={`${effort} effort`} aria-label={`${effort} effort`}>
      {[1, 2, 3].map((step) => (
        <i key={step} data-on={step <= level} />
      ))}
    </span>
  )
}
