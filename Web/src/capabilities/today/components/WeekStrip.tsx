import styles from '../today.module.css'

export function WeekStrip() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
  return (
    <div className={styles.week} aria-label="This week">
      {days.map((date) => (
        <div key={date.toISOString()} className={styles.day} data-today={date.toDateString() === today.toDateString()}>
          {date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
          <b>{date.getDate()}</b>
        </div>
      ))}
    </div>
  )
}
