import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { TextArea } from '../../../shared/ui/TextArea'
import type { PlannedWorkout } from '../interfaces/types'

type Props = { workout: PlannedWorkout | null; busy?: boolean; onClose: () => void; onSave: (workout: PlannedWorkout, log: { km: number; minutes: number; effort?: number; notes?: string }) => void }

export function LogWorkoutDialog({ workout, busy, onClose, onSave }: Props) {
  const [km, setKm] = useState('')
  const [minutes, setMinutes] = useState('')
  const [effort, setEffort] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <Dialog
      open={workout !== null}
      onClose={onClose}
      eyebrow="Training · manual log"
      title={workout ? `Log: ${workout.title}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!km || !minutes} onClick={() => workout && onSave(workout, { km: Number(km), minutes: Number(minutes), effort: effort ? Number(effort) : undefined, notes: notes || undefined })}>
            Save log
          </Button>
        </>
      }
    >
      <div className="k-form">
        <div className="k-form-row">
          <Field label="Distance" hint="km">
            <TextInput type="number" step="0.1" value={km} onChange={(event) => setKm(event.target.value)} autoFocus />
          </Field>
          <Field label="Duration" hint="minutes">
            <TextInput type="number" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
          </Field>
          <Field label="Effort" hint="1–5, optional">
            <TextInput type="number" min={1} max={5} value={effort} onChange={(event) => setEffort(event.target.value)} />
          </Field>
        </div>
        <Field label="Notes" hint="optional">
          <TextArea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <p className="muted small">Manual records are first-class. A wearable import would reconcile by provider ID rather than duplicating this.</p>
      </div>
    </Dialog>
  )
}
