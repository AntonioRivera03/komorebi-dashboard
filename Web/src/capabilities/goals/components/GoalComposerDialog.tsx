import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextInput } from '../../../shared/ui/TextInput'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { useOperation } from '../../../shared/hooks/useOperation'
import { createGoal } from '../interfaces/goalsApi'
import type { Goal, GoalDraft } from '../interfaces/types'

type Props = { open: boolean; onClose: () => void; onCreated: (goal: Goal) => void }

const empty: GoalDraft = { title: '', purpose: '', outcome: '', evidenceDefinition: '' }

export function GoalComposerDialog({ open, onClose, onCreated }: Props) {
  const [draft, setDraft] = useState<GoalDraft>(empty)
  const create = useOperation(createGoal)
  const submit = async () => {
    const result = await create.run(draft)
    if (result.status === 'completed') {
      onCreated(result.value)
      setDraft(empty)
      create.reset()
      onClose()
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Goals · P02"
      title="Define an outcome"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} busy={create.busy} disabled={!draft.title.trim()}>
            Create goal
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Goal">
          <TextInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What do you want to be true?" autoFocus />
        </Field>
        <Field label="Purpose" hint="the reason">
          <TextArea rows={2} value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} />
        </Field>
        <Field label="Desired outcome" hint="how you would recognise it">
          <TextArea rows={2} value={draft.outcome} onChange={(event) => setDraft({ ...draft, outcome: event.target.value })} />
        </Field>
        <div className="k-form-row">
          <Field label="Target date" hint="optional; exploration can stay undated">
            <TextInput type="date" value={draft.targetDate ? draft.targetDate.slice(0, 10) : ''} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value ? new Date(event.target.value).toISOString() : undefined })} />
          </Field>
          <Field label="Evidence definition" hint="what would count">
            <TextInput value={draft.evidenceDefinition} onChange={(event) => setDraft({ ...draft, evidenceDefinition: event.target.value })} />
          </Field>
        </div>
        <OperationBanner state={create.state} onRetry={submit} />
      </div>
    </Dialog>
  )
}
