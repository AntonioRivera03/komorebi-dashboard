import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextInput } from '../../../shared/ui/TextInput'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { Notice } from '../../../shared/ui/Notice'
import type { MaintenanceTemplate } from '../interfaces/types'

type Props = { open: boolean; busy?: boolean; onClose: () => void; onCreate: (draft: Pick<MaintenanceTemplate, 'title' | 'instructions' | 'cadence'>) => void }

export function NewTemplateDialog({ open, busy, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [mode, setMode] = useState<'calendar' | 'completion_relative'>('completion_relative')
  const [rule, setRule] = useState('every week')
  const [days, setDays] = useState(30)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Household · M06"
      title="New chore, maintenance or renewal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!title.trim()} onClick={() => onCreate({ title, instructions, cadence: mode === 'calendar' ? { mode, rule } : { mode, days } })}>
            Create
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Title">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </Field>
        <Field label="Instructions">
          <TextArea rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} />
        </Field>
        <Field label="Recurrence" hint="only one mechanism is active">
          <SegmentedControl label="Recurrence mode" value={mode} onChange={setMode} options={[{ value: 'completion_relative', label: 'After completion' }, { value: 'calendar', label: 'Calendar based' }]} />
        </Field>
        {mode === 'calendar' ? (
          <Field label="Rule" hint="delegated to Tasks as a series">
            <TextInput value={rule} onChange={(event) => setRule(event.target.value)} />
          </Field>
        ) : (
          <Field label="Days after last completion" hint="one next task per completion">
            <TextInput type="number" min={1} value={days} onChange={(event) => setDays(Number(event.target.value))} />
          </Field>
        )}
        <Notice glyph="✦">AI can draft a reminder from a selected manual or receipt; date and cadence always need review. No auto-enrolment from uploads.</Notice>
      </div>
    </Dialog>
  )
}
