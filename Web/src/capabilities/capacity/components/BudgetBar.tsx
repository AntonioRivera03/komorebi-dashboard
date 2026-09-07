import styles from '../capacity.module.css'

type Props = { total: number; used: number; buffer: number }

export function BudgetBar({ total, used, buffer }: Props) {
  const free = Math.max(0, total - used - buffer)
  return (
    <div>
      <div className={styles.budget} role="img" aria-label={`${used} of ${total} minutes proposed, ${buffer} buffer, ${free} free`}>
        <span data-part="used" style={{ width: `${(used / total) * 100}%` }} />
        <span data-part="buffer" style={{ width: `${(buffer / total) * 100}%` }} />
      </div>
      <div className={styles.budgetCaption}>
        <span>{used} min proposed</span>
        <span>{buffer} min buffer</span>
        <span>{free} min left open</span>
      </div>
    </div>
  )
}
