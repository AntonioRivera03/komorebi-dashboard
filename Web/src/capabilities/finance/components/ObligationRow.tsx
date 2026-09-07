import { Button } from '../../../shared/ui/Button'
import { Popover } from '../../../shared/ui/Popover'
import { MenuItem } from '../../../shared/ui/MenuItem'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { daysUntil, formatMoney, formatMonthDay, formatRelative } from '../../../shared/lib/format'
import type { Obligation } from '../interfaces/types'
import styles from '../finance.module.css'

type Props = { obligation: Obligation; onPaid: (item: Obligation) => void; onReminder: (item: Obligation, channel: 'tasks' | 'calendar') => void }

export function ObligationRow({ obligation, onPaid, onReminder }: Props) {
  const days = daysUntil(obligation.dueAt)
  return (
    <div className={styles.row}>
      <div>
        <strong style={{ fontWeight: 500 }}>{obligation.name}</strong>
        <small>
          {obligation.kind} · {obligation.cadence} · due {formatMonthDay(obligation.dueAt)} ({days < 0 ? `${-days}d ago` : `${days}d`})
          {obligation.lastPayment ? ` · last marked ${formatRelative(obligation.lastPayment.at)} (${obligation.lastPayment.provenance})` : ''}
          {obligation.reminder ? ` · reminder via ${obligation.reminder.channel} ${obligation.reminder.daysBefore}d before` : ''}
        </small>
      </div>
      <span className={styles.amount}>{formatMoney(obligation.amount.minor, obligation.amount.currency)}</span>
      <div className="k-row">
        {days <= 3 ? <StatusPill tone="warn">soon</StatusPill> : null}
        {!obligation.reminder ? (
          <Popover align="right" title="Remind me via" trigger={(props) => <Button size="sm" variant="ghost" icon="bell" {...props}>Remind</Button>}>
            {(close) => (
              <>
                <MenuItem icon="check" description="Minimum info: title and date" onClick={() => { onReminder(obligation, 'tasks'); close() }}>A task</MenuItem>
                <MenuItem icon="calendar" description="An all-day internal block" onClick={() => { onReminder(obligation, 'calendar'); close() }}>A calendar block</MenuItem>
              </>
            )}
          </Popover>
        ) : null}
        <Button size="sm" onClick={() => onPaid(obligation)}>
          Mark paid
        </Button>
      </div>
    </div>
  )
}
