import { Button } from '../../../shared/ui/Button'
import { Switch } from '../../../shared/ui/Switch'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { todayKey } from '../interfaces/habitsApi'
import type { CheckinKind, Habit } from '../interfaces/types'
import styles from '../habits.module.css'

type Props = { habit: Habit; onCheckIn: (habit: Habit, kind: CheckinKind) => void; onPause: (habit: Habit, paused: boolean) => void }

const glyph: Record<CheckinKind, string> = { completed: '✓', fallback: '~', skipped: '–', resting: '·' }

export function HabitCard({ habit, onCheckIn, onPause }: Props) {
  const today = habit.checkins.find((entry) => entry.periodKey === todayKey)
  const days = Array.from({ length: 14 }, (_, index) => {
    const key = new Date(Date.now() - (13 - index) * 86_400_000).toISOString().slice(0, 10)
    return { key, checkin: habit.checkins.find((entry) => entry.periodKey === key) }
  })
  return (
    <article className={styles.habit} data-paused={habit.paused}>
      <div className="k-row k-row--between">
        <span className={styles.cue}>when · {habit.cue}</span>
        <Switch label={`${habit.paused ? 'Resume' : 'Pause'} ${habit.action}`} checked={!habit.paused} onChange={(active) => onPause(habit, !active)} />
      </div>
      <h3>{habit.action}</h3>
      {habit.fallback ? <span className={styles.fallback}>smaller version · {habit.fallback}</span> : null}
      <div className={styles.strip} aria-label="Last 14 days">
        {days.map((day) => (
          <i key={day.key} data-kind={day.checkin?.kind} title={`${day.key} · ${day.checkin?.kind ?? 'no entry'}`}>
            {day.checkin ? glyph[day.checkin.kind] : ''}
          </i>
        ))}
      </div>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill>{habit.cadence}</StatusPill>
          {habit.taskSeriesRef ? <StatusPill tone="soft" title="Occurrences come from a Tasks series; no second schedule">tasks series</StatusPill> : null}
          {habit.reminder?.quietHours ? <StatusPill tone="soft">quiet hours</StatusPill> : null}
        </div>
        {habit.paused ? (
          <span className="muted small">Paused · no nudges</span>
        ) : today ? (
          <StatusPill tone={today.kind === 'completed' ? 'ok' : today.kind === 'skipped' ? 'warn' : 'neutral'}>today · {today.kind}</StatusPill>
        ) : (
          <div className={styles.checkins}>
            <Button size="sm" variant="primary" onClick={() => onCheckIn(habit, 'completed')}>
              Did it
            </Button>
            {habit.fallback ? (
              <Button size="sm" onClick={() => onCheckIn(habit, 'fallback')}>
                Smaller version
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => onCheckIn(habit, 'resting')}>
              Resting
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onCheckIn(habit, 'skipped')}>
              Skipped
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
