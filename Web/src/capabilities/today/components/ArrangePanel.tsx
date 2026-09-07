import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { Switch } from '../../../shared/ui/Switch'
import { IconButton } from '../../../shared/ui/IconButton'
import { Divider } from '../../../shared/ui/Divider'
import type { ContributionKind, Dismissal, TodayLayout } from '../interfaces/types'
import { ProducerStatusList } from './ProducerStatusList'
import type { ProducerStatus } from '../interfaces/types'
import styles from '../today.module.css'

type Props = {
  open: boolean
  layout: TodayLayout
  producers: ProducerStatus[]
  dismissals: Dismissal[]
  onClose: () => void
  onChange: (layout: TodayLayout) => void
  onRestore: (key: string) => void
}

const labels: Record<ContributionKind, string> = { exception: 'Exceptions (always first)', commitment: 'Next commitment (always second)', action: 'Actions and goals', learning: 'Learning', home: 'Home' }

export function ArrangePanel({ open, layout, producers, dismissals, onClose, onChange, onRestore }: Props) {
  const move = (kind: ContributionKind, direction: -1 | 1) => {
    const order = [...layout.order]
    const index = order.indexOf(kind)
    const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    onChange({ ...layout, order })
  }
  return (
    <SidePanel open={open} onClose={onClose} eyebrow="Today · layout" title="Arrange" footer={<Button onClick={onClose}>Done</Button>}>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Reorder ordinary sections or hide them. Exceptions and the next fixed commitment keep their place so nothing urgent is buried.
      </p>
      {layout.order.map((kind, index) => (
        <div key={kind} className={styles.arrangeRow} data-hidden={layout.hidden.includes(kind)}>
          <span>{labels[kind]}</span>
          <div className="k-row">
            {kind !== 'exception' && kind !== 'commitment' ? (
              <>
                <IconButton size="sm" icon="chevron-down" label="Move down" onClick={() => move(kind, 1)} disabled={index === layout.order.length - 1} />
                <IconButton size="sm" icon="chevron-down" label="Move up" style={{ transform: 'rotate(180deg)' }} onClick={() => move(kind, -1)} disabled={index <= 2} />
                <Switch label={`Show ${kind}`} checked={!layout.hidden.includes(kind)} onChange={(show) => onChange({ ...layout, hidden: show ? layout.hidden.filter((item) => item !== kind) : [...layout.hidden, kind] })} />
              </>
            ) : (
              <span className="muted small">fixed</span>
            )}
          </div>
        </div>
      ))}
      <Divider label="Dismissed" />
      {dismissals.length === 0 ? <p className="muted small">Nothing dismissed right now.</p> : null}
      {dismissals.map((dismissal) => (
        <div key={dismissal.key} className={styles.arrangeRow}>
          <span className="mono small">
            {dismissal.key} · until {new Date(dismissal.until).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          <Button size="sm" variant="ghost" onClick={() => onRestore(dismissal.key)}>
            Restore
          </Button>
        </div>
      ))}
      <Divider label="Producers" />
      <ProducerStatusList producers={producers} />
    </SidePanel>
  )
}
