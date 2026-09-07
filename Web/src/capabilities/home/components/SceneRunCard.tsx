import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { SceneRun } from '../interfaces/types'
import styles from '../home.module.css'

type Props = { run: SceneRun; onRestore?: (run: SceneRun) => void; restoring?: boolean }

const tone = (result: SceneRun['targets'][number]['result']) => (result === 'confirmed' ? 'ok' : result === 'failed' ? 'danger' : result === 'pending' ? 'neutral' : 'warn')

export function SceneRunCard({ run, onRestore, restoring }: Props) {
  return (
    <div className="k-panel k-panel--card" style={{ padding: 16, animation: 'none' }}>
      <div className="k-row k-row--between">
        <div>
          <strong style={{ fontWeight: 500 }}>{run.sceneName}</strong>
          <span className="muted small mono">
            {' '}
            · r{run.revision} · {formatRelative(run.startedAt)}
          </span>
        </div>
        <StatusPill tone={run.aggregate === 'completed' ? 'ok' : run.aggregate === 'failed' ? 'danger' : run.aggregate === 'running' ? 'accent' : 'warn'} live={run.aggregate === 'running'}>
          {run.aggregate}
        </StatusPill>
      </div>
      <div style={{ marginTop: 8 }}>
        {run.targets.map((target) => (
          <div key={target.deviceId} className={styles.runTarget}>
            <span>
              {target.deviceName} <span className="muted small">· {target.action} → {target.value}</span>
              {target.note ? <span className="muted small"> · {target.note}</span> : null}
            </span>
            <StatusPill tone={tone(target.result)} live={target.result === 'pending'}>
              {target.result}
            </StatusPill>
          </div>
        ))}
      </div>
      {onRestore && run.restorable && run.aggregate !== 'running' ? (
        <div className="k-row k-row--between" style={{ marginTop: 10 }}>
          <span className="muted small">Conditional restore skips devices changed since this run.</span>
          <Button size="sm" onClick={() => onRestore(run)} busy={restoring}>
            Restore previous state
          </Button>
        </div>
      ) : null}
    </div>
  )
}
