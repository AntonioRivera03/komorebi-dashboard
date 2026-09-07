import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatMonthDay } from '../../../shared/lib/format'
import type { PlannedWorkout } from '../interfaces/types'
import styles from '../training.module.css'

type Props = { workout: PlannedWorkout; onLog: (workout: PlannedWorkout) => void; onMove: (workout: PlannedWorkout) => void }

export function WorkoutRow({ workout, onLog, onMove }: Props) {
  const date = new Date(workout.date)
  return (
    <div className={styles.workout} data-status={workout.status}>
      <div className={styles.date}>
        {date.toLocaleDateString(undefined, { weekday: 'short' })}
        <b>{formatMonthDay(workout.date)}</b>
      </div>
      <div>
        <span className={styles.effort} data-effort={workout.effort} aria-hidden="true" />
        <strong style={{ fontWeight: 500 }}>{workout.title}</strong>
        <span className="muted small">
          {' '}
          · plan {workout.targetKm ? `${workout.targetKm} km` : `${workout.targetMinutes} min`} · {workout.effort}
        </span>
        {workout.log ? (
          <div className="muted small mono" style={{ marginTop: 3 }}>
            logged {workout.log.km} km · {workout.log.minutes} min{workout.log.effort ? ` · effort ${workout.log.effort}/5` : ''}{workout.log.notes ? ` · ${workout.log.notes}` : ''} · {workout.log.source}
          </div>
        ) : null}
      </div>
      <div className="k-row">
        <StatusPill tone={workout.status === 'done' ? 'ok' : workout.status === 'missed' ? 'danger' : workout.status === 'moved' ? 'warn' : 'neutral'}>{workout.status}</StatusPill>
        {workout.status === 'planned' || workout.status === 'moved' ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => onMove(workout)}>
              Move
            </Button>
            <Button size="sm" onClick={() => onLog(workout)}>
              Log
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
