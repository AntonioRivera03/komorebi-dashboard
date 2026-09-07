import { Sparkbars } from '../../../shared/ui/Sparkbars'
import { StatTile } from '../../../shared/ui/StatTile'
import type { SchedulerProfile } from '../interfaces/types'
import styles from '../reviews.module.css'

type Props = { profile: SchedulerProfile; forecast: number[]; tradeoff: { retention: number; reviewsPerDay: number }[]; onCap: (cap: number) => void; onRetention: (retention: number) => void }

/** Workload and retention trade-offs are visible; the cap changes the session, never the history. */
export function WorkloadPanel({ profile, forecast, tradeoff, onCap, onRetention }: Props) {
  return (
    <div className="k-stack" style={{ gap: 16 }}>
      <div className={styles.cap}>
        <span className="label">Daily cap</span>
        <strong>{profile.dailyCap}</strong>
        <input type="range" min={5} max={60} step={5} value={profile.dailyCap} onChange={(event) => onCap(Number(event.target.value))} aria-label="Daily review cap" />
        <span className="muted small">{profile.newCap} new items per day · overdue items beyond the cap stay due, not learned</span>
      </div>
      <div>
        <span className="label">14-day forecast</span>
        <div style={{ marginTop: 8 }}>
          <Sparkbars values={forecast} labels={forecast.map((value, index) => `day ${index + 1}: ${value}`)} highlightIndex={0} ariaLabel="Review workload forecast" />
        </div>
      </div>
      <div>
        <span className="label">Retention target</span>
        <div className={styles.tradeoff} style={{ marginTop: 8 }} role="group" aria-label="Retention trade-off">
          {tradeoff.map((option) => (
            <button key={option.retention} type="button" aria-pressed={profile.retention === option.retention} onClick={() => onRetention(option.retention)}>
              <b>{Math.round(option.retention * 100)}%</b>
              <span>{option.reviewsPerDay}/day</span>
            </button>
          ))}
        </div>
      </div>
      <div className="k-stats">
        <StatTile value={profile.algorithm} label={`scheduler v${profile.version}`} />
      </div>
    </div>
  )
}
