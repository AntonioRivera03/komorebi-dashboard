import { Switch } from '../../../shared/ui/Switch'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ModuleConfig } from '../interfaces/types'
import styles from '../settings.module.css'

type Props = { module: ModuleConfig; onToggle: (module: ModuleConfig, enabled: boolean) => void }

export function ModuleToggleRow({ module, onToggle }: Props) {
  return (
    <div className={styles.module}>
      <div>
        {module.name}
        <small>
          {module.fundamental} · {module.priority}
          {module.requires.length ? ` · needs ${module.requires.join(', ')}` : ''}
          {module.dependents.length ? ` · used by ${module.dependents.join(', ')}` : ''}
        </small>
      </div>
      <div className="k-row">
        {module.priority === 'undecided' ? <StatusPill tone="warn">undecided</StatusPill> : null}
        <Switch label={`Enable ${module.name}`} checked={module.enabled} onChange={(enabled) => onToggle(module, enabled)} />
      </div>
    </div>
  )
}
