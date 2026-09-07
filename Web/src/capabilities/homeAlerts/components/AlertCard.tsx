import { Button } from '../../../shared/ui/Button'
import { Popover } from '../../../shared/ui/Popover'
import { MenuItem } from '../../../shared/ui/MenuItem'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { AlertInstance } from '../interfaces/types'
import { ObservationStrip } from './ObservationStrip'
import styles from '../homeAlerts.module.css'

type Props = { alert: AlertInstance; onAcknowledge: (alert: AlertInstance) => void; onSnooze: (alert: AlertInstance, hours: number) => void; busy?: boolean }

export function AlertCard({ alert, onAcknowledge, onSnooze, busy }: Props) {
  return (
    <article className={styles.alert} data-severity={alert.severity} data-condition={alert.condition}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={alert.condition === 'active' ? 'warn' : 'ok'} live={alert.condition === 'active'}>
            {alert.condition}
          </StatusPill>
          <StatusPill tone={alert.acknowledged ? 'neutral' : 'accent'}>{alert.acknowledged ? `acknowledged ${formatRelative(alert.acknowledged.at)}` : 'unacknowledged'}</StatusPill>
          <StatusPill title="Delivery status is owned by Core Notifications">notification · {alert.notification.replace('_', ' ')}</StatusPill>
        </div>
        <span className="muted small mono">opened {formatRelative(alert.openedAt)}</span>
      </div>
      <h3>{alert.ruleName}</h3>
      <p className={styles.why}>{alert.why}</p>
      <ObservationStrip observations={alert.observations} />
      <div className="k-row k-row--between">
        <span className="muted small">Acknowledgement and condition recovery are separate states.</span>
        <div className="k-row">
          <Popover align="right" title="Snooze for" trigger={(props) => <Button size="sm" variant="ghost" icon="clock" {...props}>Snooze</Button>}>
            {(close) => (
              <>
                <MenuItem onClick={() => { onSnooze(alert, 1); close() }}>1 hour</MenuItem>
                <MenuItem onClick={() => { onSnooze(alert, 4); close() }}>4 hours</MenuItem>
                <MenuItem onClick={() => { onSnooze(alert, 24); close() }}>Until tomorrow</MenuItem>
              </>
            )}
          </Popover>
          {!alert.acknowledged ? (
            <Button size="sm" variant="primary" icon="check" onClick={() => onAcknowledge(alert)} busy={busy}>
              Acknowledge
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
