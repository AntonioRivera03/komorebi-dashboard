import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { Checkbox } from '../../../shared/ui/Checkbox'
import type { SkillMode } from '../interfaces/types'

type Props = { open: boolean; busy?: boolean; onClose: () => void; onCreate: (title: string, purpose: string, modes: SkillMode[]) => void }

export function NewTargetDialog({ open, busy, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [modes, setModes] = useState<SkillMode[]>(['listening', 'speaking'])
  const toggle = (mode: SkillMode) => setModes((current) => (current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]))
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Japanese · practical target"
      title="What do you want to be able to do?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!title.trim() || modes.length === 0} onClick={() => onCreate(title, purpose, modes)}>
            Add target
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Target">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ask for directions to the station" autoFocus />
        </Field>
        <Field label="Why">
          <TextInput value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Getting around alone in Kyoto" />
        </Field>
        <Field label="Modes">
          <div className="k-row">
            {(['listening', 'reading', 'writing', 'speaking'] as SkillMode[]).map((mode) => (
              <label key={mode} className="k-row" style={{ fontSize: 12 }}>
                <Checkbox checked={modes.includes(mode)} onChange={() => toggle(mode)} /> {mode}
              </label>
            ))}
          </div>
        </Field>
        <p className="muted small">No proficiency is inferred. Targets are configured; progress links to real attempts with their assistance level.</p>
      </div>
    </Dialog>
  )
}
