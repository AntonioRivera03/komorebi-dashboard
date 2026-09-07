import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Notice } from '../../../shared/ui/Notice'
import type { SimulationResult } from '../interfaces/types'
import styles from '../automation.module.css'

type Props = { result: SimulationResult | null; ruleName: string; onClose: () => void }

/** Simulation performs no writes. */
export function SimulationDialog({ result, ruleName, onClose }: Props) {
  return (
    <Dialog open={result !== null} onClose={onClose} eyebrow={`Simulation · ${ruleName}`} title={result?.wouldRun ? 'It would run' : 'It would not run'} footer={<Button onClick={onClose}>Close</Button>}>
      {result ? (
        <div className="k-stack">
          <Notice tone={result.wouldRun ? 'ok' : 'warn'} glyph={result.wouldRun ? '✓' : '!'}>
            {result.reasons.map((reason) => (
              <div key={reason}>{reason}</div>
            ))}
          </Notice>
          <span className="label">Steps that would execute</span>
          {result.steps.map((step) => (
            <div key={step.command} className={styles.step}>
              <span>
                <code>{step.command}</code>
                <small>{step.label}</small>
              </span>
              <span className="muted small">no write performed</span>
            </div>
          ))}
        </div>
      ) : null}
    </Dialog>
  )
}
