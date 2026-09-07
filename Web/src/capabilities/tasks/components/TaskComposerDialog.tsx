import { useId, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { Select } from '../../../shared/ui/Select'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextInput } from '../../../shared/ui/TextInput'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { useOperation } from '../../../shared/hooks/useOperation'
import { newId } from '../../../shared/api/mock'
import { createTask } from '../interfaces/tasksApi'
import type { Effort, Task, TaskDraft } from '../interfaces/types'

type Props = { open: boolean; onClose: () => void; onCreated: (task: Task) => void; contexts: string[] }

const empty: TaskDraft = { title: '', effort: 'medium', priority: false }

export function TaskComposerDialog({ open, onClose, onCreated, contexts }: Props) {
  const [draft, setDraft] = useState<TaskDraft>(empty)
  const [key, setKey] = useState(() => newId('idem'))
  const id = useId()
  const create = useOperation(createTask)

  const submit = async () => {
    const result = await create.run(draft, key)
    if (result.status === 'completed') {
      onCreated(result.value)
      setDraft(empty)
      setKey(newId('idem'))
      create.reset()
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New task"
      eyebrow="Tasks · P03"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} busy={create.busy} disabled={!draft.title.trim()}>
            Create task
          </Button>
        </>
      }
    >
      <form
        className="k-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field label="Title" htmlFor={`${id}-title`}>
          <TextInput id={`${id}-title`} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What needs doing?" autoFocus />
        </Field>
        <Field label="Description" htmlFor={`${id}-desc`} hint="optional">
          <TextArea id={`${id}-desc`} value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} />
        </Field>
        <div className="k-form-row">
          <Field label="Deadline" htmlFor={`${id}-due`} hint="optional">
            <TextInput id={`${id}-due`} type="datetime-local" value={draft.dueAt ? draft.dueAt.slice(0, 16) : ''} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value ? new Date(event.target.value).toISOString() : undefined })} />
          </Field>
          <Field label="Estimate" htmlFor={`${id}-est`} hint="minutes">
            <TextInput id={`${id}-est`} type="number" min={5} step={5} value={draft.estimateMinutes ?? ''} onChange={(event) => setDraft({ ...draft, estimateMinutes: event.target.value ? Number(event.target.value) : undefined })} />
          </Field>
        </div>
        <div className="k-form-row">
          <Field label="Effort" htmlFor={`${id}-effort`}>
            <Select id={`${id}-effort`} value={draft.effort} onChange={(event) => setDraft({ ...draft, effort: event.target.value as Effort })} options={[{ value: 'light', label: 'Light' }, { value: 'medium', label: 'Medium' }, { value: 'deep', label: 'Deep focus' }]} />
          </Field>
          <Field label="Context" htmlFor={`${id}-ctx`}>
            <TextInput id={`${id}-ctx`} list={`${id}-ctx-list`} value={draft.context ?? ''} onChange={(event) => setDraft({ ...draft, context: event.target.value || undefined })} placeholder="study, admin, home…" />
            <datalist id={`${id}-ctx-list`}>
              {contexts.map((context) => (
                <option key={context} value={context} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Recurrence" htmlFor={`${id}-rec`} hint="creates a series; occurrences stay separate">
          <Select id={`${id}-rec`} value={draft.recurrence ?? ''} onChange={(event) => setDraft({ ...draft, recurrence: event.target.value || undefined })} options={[{ value: '', label: 'Does not repeat' }, { value: 'every day', label: 'Every day' }, { value: 'every weekday', label: 'Every weekday' }, { value: 'every week', label: 'Every week' }, { value: 'every month', label: 'Every month' }]} />
        </Field>
        <label className="k-row" style={{ fontSize: 12 }}>
          <Checkbox checked={draft.priority ?? false} onChange={(event) => setDraft({ ...draft, priority: event.target.checked })} />
          Mark as an explicit priority
        </label>
        <OperationBanner state={create.state} onRetry={submit} />
        <p className="muted small">
          Idempotency key <span className="mono">{key}</span> · retrying after a lost response returns the same task.
        </p>
      </form>
    </Dialog>
  )
}
