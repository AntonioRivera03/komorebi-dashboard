import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { Select } from '../../../shared/ui/Select'

type Props = { open: boolean; busy?: boolean; onClose: () => void; onCreate: (cue: string, action: string, fallback: string, cadence: string) => void }

export function NewHabitDialog({ open, busy, onClose, onCreate }: Props) {
  const [cue, setCue] = useState('')
  const [action, setAction] = useState('')
  const [fallback, setFallback] = useState('')
  const [cadence, setCadence] = useState('daily')
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Habits · cue → action → smaller version"
      title="Give a routine a cue"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!cue.trim() || !action.trim()} onClick={() => onCreate(cue, action, fallback, cadence)}>
            Create habit
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Cue" hint="when">
          <TextInput value={cue} onChange={(event) => setCue(event.target.value)} placeholder="After the evening walk" autoFocus />
        </Field>
        <Field label="Ordinary version">
          <TextInput value={action} onChange={(event) => setAction(event.target.value)} placeholder="20-minute study block" />
        </Field>
        <Field label="Smaller version" hint="optional fallback">
          <TextInput value={fallback} onChange={(event) => setFallback(event.target.value)} placeholder="Read one passage" />
        </Field>
        <Field label="Cadence">
          <Select value={cadence} onChange={(event) => setCadence(event.target.value)} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays' }, { value: 'weekly', label: 'Weekly' }]} />
        </Field>
        <p className="muted small">No model decides whether rest is legitimate or raises expectations. Rest never appears as a failed streak.</p>
      </div>
    </Dialog>
  )
}
