import { Button } from '../../../shared/ui/Button'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { Switch } from '../../../shared/ui/Switch'
import type { EffortPreference, PlanningInput } from '../interfaces/types'
import styles from '../capacity.module.css'

type Props = { input: PlanningInput; onChange: (input: PlanningInput) => void; onPlan: () => void; loading: boolean }

export function CapacityInputs({ input, onChange, onPlan, loading }: Props) {
  return (
    <div className={styles.inputs}>
      <div>
        <span className="label">Available now</span>
        <div className={styles.minutes}>
          {input.availableMinutes}
          <small>MIN</small>
        </div>
        <input type="range" min={15} max={240} step={5} value={input.availableMinutes} onChange={(event) => onChange({ ...input, availableMinutes: Number(event.target.value) })} aria-label="Available minutes" style={{ marginTop: 12 }} />
      </div>
      <div>
        <span className="label">Energy for</span>
        <div style={{ marginTop: 8 }}>
          <SegmentedControl<EffortPreference> label="Effort" value={input.effort} onChange={(effort) => onChange({ ...input, effort })} options={[{ value: 'any', label: 'Anything' }, { value: 'light', label: 'Light' }, { value: 'medium', label: 'Medium' }, { value: 'deep', label: 'Deep' }]} />
        </div>
      </div>
      <div className="k-row k-row--between">
        <span style={{ fontSize: 12 }}>Include learning</span>
        <Switch label="Include learning" checked={input.includeLearning} onChange={(includeLearning) => onChange({ ...input, includeLearning })} />
      </div>
      <div className="k-row k-row--between">
        <span style={{ fontSize: 12 }}>Include admin</span>
        <Switch label="Include admin" checked={input.includeAdmin} onChange={(includeAdmin) => onChange({ ...input, includeAdmin })} />
      </div>
      <Button variant="primary" block onClick={onPlan} busy={loading} icon="sparkle">
        Suggest a feasible set
      </Button>
      <p className="muted small">Time and effort are what you report, not inferred health data. Unscheduled capacity stays visible.</p>
    </div>
  )
}
