import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { AutomationRule } from '../interfaces/types'
import styles from '../automation.module.css'

type Props = { rule: AutomationRule; busy?: boolean; onSimulate: (rule: AutomationRule) => void; onToggle: (rule: AutomationRule) => void; onInspect: (rule: AutomationRule) => void }

export function RuleCard({ rule, busy, onSimulate, onToggle, onInspect }: Props) {
  return (
    <article className={styles.rule} data-status={rule.status}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={rule.status === 'enabled' ? 'ok' : rule.status === 'paused' ? 'warn' : 'neutral'} live={rule.status === 'enabled'}>
            {rule.status}
          </StatusPill>
          <span className="muted small mono">
            r{rule.revision} · cooldown {rule.cooldownMinutes} min · max {rule.maxRunsPerDay}/day
          </span>
        </div>
        <span className="muted small mono">grant {rule.grant.scopes.join(', ')} · {formatRelative(rule.grant.grantedAt)}</span>
      </div>
      <h3>{rule.name}</h3>
      <p className={styles.preview}>{rule.preview}</p>
      <div className={styles.chain}>
        <span data-part="trigger">{rule.trigger.label}</span>
        {rule.conditions.map((condition) => (
          <span key={condition.predicate}>
            <i>if </i>
            {condition.label}
          </span>
        ))}
        <i>→</i>
        {rule.actions.map((action) => (
          <span key={action.command} data-part="action" title={action.idempotent ? 'idempotent' : 'not idempotent'}>
            {action.label}
          </span>
        ))}
      </div>
      <div className="k-row k-row--between">
        <Button size="sm" variant="ghost" onClick={() => onInspect(rule)}>
          Runs
        </Button>
        <div className="k-row">
          <Button size="sm" icon="eye" busy={busy} onClick={() => onSimulate(rule)}>
            Simulate
          </Button>
          <Button size="sm" variant={rule.status === 'enabled' ? 'outline' : 'primary'} icon={rule.status === 'enabled' ? 'pause' : 'play'} onClick={() => onToggle(rule)}>
            {rule.status === 'enabled' ? 'Pause' : 'Enable'}
          </Button>
        </div>
      </div>
    </article>
  )
}
