import { formatTime } from '../../../shared/lib/format'
import type { AlertInstance } from '../interfaces/types'
import styles from '../homeAlerts.module.css'

/** The observations a rule used; unknown gaps are drawn as gaps, not as values. */
export function ObservationStrip({ observations }: { observations: AlertInstance['observations'] }) {
  return (
    <div className={styles.observations} role="img" aria-label="Observations used by the rule">
      {observations.map((obs, index) => (
        <span key={index} className={styles.obs} data-state={obs.state} data-label={`${formatTime(obs.at)} · ${obs.value} · ${obs.state}`} style={{ height: obs.state === 'available' ? '100%' : '40%' }} />
      ))}
    </div>
  )
}
