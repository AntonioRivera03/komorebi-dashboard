import { SidePanel } from '../../../shared/ui/SidePanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { AutomationRun } from '../interfaces/types'
import styles from '../automation.module.css'

type Props = { open: boolean; ruleName: string; runs: AutomationRun[]; onClose: () => void }

const tone = (status: AutomationRun['status']) => (status === 'completed' ? 'ok' : status === 'failed' ? 'danger' : status === 'partial' ? 'warn' : 'neutral')

export function RunInspectorPanel({ open, ruleName, runs, onClose }: Props) {
  return (
    <SidePanel open={open} onClose={onClose} eyebrow="Automation · runs" title={ruleName} wide>
      {runs.length === 0 ? <p className="muted small">No runs yet.</p> : null}
      {runs.map((run) => (
        <div key={run.id} className={styles.run} style={{ display: 'block' }}>
          <div className="k-row k-row--between">
            <div>
              <strong style={{ fontWeight: 500 }}>{run.id}</strong>
              <small>
                trigger {run.triggerEventId} · rule r{run.ruleRevision} · {formatRelative(run.startedAt)}
              </small>
            </div>
            <StatusPill tone={tone(run.status)}>{run.status}</StatusPill>
          </div>
          {run.status === 'skipped' ? <p className="muted small" style={{ marginTop: 6 }}>Duplicate trigger delivery deduplicated by (rule revision, trigger identity). One logical run.</p> : null}
          {run.steps.map((step) => (
            <div key={step.id} className={styles.step}>
              <span>
                <code>{step.command}</code>
                <small>
                  {step.detail} · key {step.idempotencyKey}
                </small>
              </span>
              <StatusPill tone={step.status === 'completed' ? 'ok' : step.status === 'failed' ? 'danger' : 'neutral'}>{step.status}</StatusPill>
            </div>
          ))}
          {run.evaluated.length ? (
            <div className="k-row" style={{ marginTop: 8 }}>
              {run.evaluated.map((ref) => (
                <span key={ref.ref} className="k-ref">
                  {ref.ref} · r{ref.revision}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </SidePanel>
  )
}
