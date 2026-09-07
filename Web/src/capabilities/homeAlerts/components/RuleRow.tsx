import { Switch } from '../../../shared/ui/Switch'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { AlertRule } from '../interfaces/types'
import styles from '../homeAlerts.module.css'

type Props = { rule: AlertRule; onToggle: (rule: AlertRule) => void; onEdit: (rule: AlertRule) => void }

export function RuleRow({ rule, onToggle, onEdit }: Props) {
  return (
    <div className={styles.rule}>
      <div>
        <strong style={{ fontWeight: 500 }}>{rule.name}</strong>
        <small>
          {rule.deviceName} · {rule.condition} · persists {rule.persistenceMinutes} min{rule.quietChannel ? ' · quiet channel' : ''} · r{rule.revision}
        </small>
      </div>
      <div className="k-row">
        <StatusPill tone="soft">{rule.kind.replace('_', ' ')}</StatusPill>
        <Button size="sm" variant="ghost" icon="edit" onClick={() => onEdit(rule)}>
          Edit
        </Button>
        <Switch label={`Enable ${rule.name}`} checked={rule.enabled} onChange={() => onToggle(rule)} />
      </div>
    </div>
  )
}
