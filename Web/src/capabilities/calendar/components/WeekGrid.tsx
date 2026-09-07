import { useMemo } from 'react'
import { daysFromNow } from '../../../shared/api/mock'
import { useNow } from '../../../shared/hooks/useNow'
import type { AgendaItem } from '../interfaces/types'
import { AgendaItemChip } from './AgendaItemChip'
import styles from '../calendar.module.css'

const HOUR = 44
const START_HOUR = 7
const END_HOUR = 23

type Props = {
  fromDay: number
  days: number
  items: AgendaItem[]
  ghost?: { start: string; end: string } | null
  onSelect: (item: AgendaItem) => void
  onSlot: (start: string) => void
}

function minutesFromStart(iso: string): number {
  const date = new Date(iso)
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes()
}

export function WeekGrid({ fromDay, days, items, ghost, onSelect, onSlot }: Props) {
  const now = useNow(60_000)
  const columns = useMemo(() => Array.from({ length: days }, (_, index) => new Date(daysFromNow(fromDay + index, 0))), [fromDay, days])
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index)
  const height = (END_HOUR - START_HOUR) * HOUR

  const timed = items.filter((item) => !item.allDay)
  const allDay = items.filter((item) => item.allDay)

  return (
    <div className={styles.week} style={{ '--days': days, '--hour': `${HOUR}px`, '--hours-height': `${height}px` } as React.CSSProperties}>
      <div className={styles.dayHead} />
      {columns.map((date) => (
        <div key={date.toISOString()} className={styles.dayHead} data-today={date.toDateString() === now.toDateString()}>
          {date.toLocaleDateString(undefined, { weekday: 'short' })}
          <b>{date.getDate()}</b>
        </div>
      ))}
      <div className={styles.gutter} style={{ height: 26 }}>
        <span style={{ top: '50%' }}>all</span>
      </div>
      {columns.map((date) => (
        <div key={`ad-${date.toISOString()}`} className={styles.allDay}>
          {allDay
            .filter((item) => new Date(item.start).toDateString() === date.toDateString())
            .map((item) => (
              <AgendaItemChip key={item.id} item={item} compact onSelect={onSelect} />
            ))}
        </div>
      ))}
      <div className={styles.gutter} style={{ height }}>
        {hours.map((hour) => (
          <span key={hour} style={{ top: (hour - START_HOUR) * HOUR }}>
            {String(hour).padStart(2, '0')}
          </span>
        ))}
      </div>
      {columns.map((date) => {
        const isToday = date.toDateString() === now.toDateString()
        const nowTop = (now.getHours() - START_HOUR) * HOUR + (now.getMinutes() / 60) * HOUR
        return (
          <div
            key={`col-${date.toISOString()}`}
            className={styles.column}
            data-today={isToday}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const minutes = Math.floor(((event.clientY - rect.top) / HOUR) * 60 / 15) * 15
              const start = new Date(date)
              start.setHours(START_HOUR, minutes, 0, 0)
              onSlot(start.toISOString())
            }}
            role="presentation"
          >
            {isToday && nowTop > 0 && nowTop < height ? <div className={styles.nowLine} style={{ top: nowTop }} aria-hidden="true" /> : null}
            {timed
              .filter((item) => new Date(item.start).toDateString() === date.toDateString())
              .map((item) => {
                const top = (minutesFromStart(item.start) / 60) * HOUR
                const bottom = (minutesFromStart(item.end) / 60) * HOUR
                return <AgendaItemChip key={item.id} item={item} style={{ top, height: Math.max(22, bottom - top) }} onSelect={onSelect} />
              })}
            {ghost && new Date(ghost.start).toDateString() === date.toDateString() ? (
              <div className={styles.ghost} style={{ top: (minutesFromStart(ghost.start) / 60) * HOUR, height: Math.max(22, ((minutesFromStart(ghost.end) - minutesFromStart(ghost.start)) / 60) * HOUR) }}>
                proposed
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
