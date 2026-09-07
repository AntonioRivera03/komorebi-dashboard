import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { Adjustment } from '../interfaces/types'
import styles from '../reflection.module.css'

type Props = { adjustment: Adjustment; busy?: boolean; onApply: (adjustment: Adjustment) => void }

export function AdjustmentRow({ adjustment, busy, onApply }: Props) {
  return (
    <div className={styles.adjustment}>
      <div>
        {adjustment.label}
        <code>
          {adjustment.owner} · {adjustment.command}
        </code>
      </div>
      <div className="k-row">
        <StatusPill tone={adjustment.status === 'applied' ? 'ok' : adjustment.status === 'failed' ? 'danger' : 'neutral'}>{adjustment.status}</StatusPill>
        {adjustment.status !== 'applied' ? (
          <Button size="sm" busy={busy} onClick={() => onApply(adjustment)}>
            {adjustment.status === 'failed' ? 'Retry' : 'Accept'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
