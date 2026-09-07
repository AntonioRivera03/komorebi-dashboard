import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextInput } from '../../../shared/ui/TextInput'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { useOperation } from '../../../shared/hooks/useOperation'
import { createNote } from '../interfaces/knowledgeApi'
import type { ConceptNote } from '../interfaces/types'

type Props = { open: boolean; onClose: () => void; onCreated: (note: ConceptNote) => void }

export function NoteComposerDialog({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [topics, setTopics] = useState('')
  const create = useOperation(createNote)
  const submit = async () => {
    const result = await create.run(title, body, topics.split(',').map((topic) => topic.trim()).filter(Boolean))
    if (result.status === 'completed') {
      onCreated(result.value)
      setTitle('')
      setBody('')
      setTopics('')
      create.reset()
      onClose()
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Knowledge · L02"
      title="Write it in your own words"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} busy={create.busy} disabled={!title.trim()}>
            Create note
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Title">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} autoFocus placeholder="A claim you can defend" />
        </Field>
        <Field label="Explanation" hint="yours, not the source's">
          <TextArea rows={6} value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <Field label="Topics" hint="comma separated">
          <TextInput value={topics} onChange={(event) => setTopics(event.target.value)} placeholder="working memory, cognition" />
        </Field>
        <OperationBanner state={create.state} onRetry={submit} />
      </div>
    </Dialog>
  )
}
