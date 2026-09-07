import { Popover } from '../../../shared/ui/Popover'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { DueItem } from '../interfaces/types'
import styles from '../reviews.module.css'

export function DueItemRow({ item, paused }: { item: DueItem; paused: boolean }) {
  return (
    <div className={styles.due} data-paused={paused}>
      <div>
        <q>{item.question}</q>
        <small>
          {item.topic} · stability {item.stability.toFixed(1)} d{item.lastRating ? ` · last ${item.lastRating}` : ' · new'}
          {item.overdueDays > 0 ? ` · ${item.overdueDays} d overdue` : ''}
        </small>
      </div>
      <Popover align="right" width={260} title="why due" trigger={(props) => <button type="button" className="k-btn k-btn--ghost k-btn--sm" {...props}>why?</button>}>
        <p style={{ fontSize: 11, lineHeight: 1.5, padding: '4px 8px' }}>
          {item.why}
          {paused ? <StatusPill tone="warn">topic paused</StatusPill> : null}
        </p>
      </Popover>
    </div>
  )
}
