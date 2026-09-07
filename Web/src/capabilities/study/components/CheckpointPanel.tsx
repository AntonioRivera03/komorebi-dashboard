import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { Field } from '../../../shared/ui/Field'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextInput } from '../../../shared/ui/TextInput'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { draftCheckpointWithAi, saveCheckpoint } from '../interfaces/studyApi'
import type { Checkpoint } from '../interfaces/types'

type Props = { open: boolean; sessionId: string; sessionTitle: string; onClose: () => void; onSaved: (checkpoint: Checkpoint) => void }

/** L07: a small restart note. AI drafts it from the session; you edit; the corrected version is what resumes. */
export function CheckpointPanel({ open, sessionId, sessionTitle, onClose, onSaved }: Props) {
  const toast = useToast()
  const [topic, setTopic] = useState(sessionTitle)
  const [understood, setUnderstood] = useState('')
  const [openQuestion, setOpenQuestion] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => setTopic(sessionTitle), [sessionTitle])

  const draft = async () => {
    setDrafting(true)
    const result = await draftCheckpointWithAi(sessionId)
    setDrafting(false)
    setTopic(result.topic)
    setUnderstood(result.understood)
    setOpenQuestion(result.openQuestion)
    setNextStep(result.nextStep)
    setGenerated(true)
  }

  const save = async () => {
    setSaving(true)
    const result = await saveCheckpoint(sessionId, { topic, understood, openQuestion, nextStep, sourceRefs: [{ sourceTitle: 'Baddeley (2000)', locator: 'p. 421 §2', route: '/learn/library/src_baddeley', available: true }], generatedBy: generated ? 'ai' : 'user' })
    setSaving(false)
    if (result.status === 'completed') {
      onSaved(result.value)
      toast('Checkpoint saved · resumable from Today')
      onClose()
    }
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      eyebrow="Study · L07 return ticket"
      title="Leave a checkpoint"
      footer={
        <>
          <Button icon="sparkle" onClick={draft} busy={drafting}>
            Draft from this session
          </Button>
          <span style={{ flex: 1 }} />
          <Button variant="primary" onClick={save} busy={saving} disabled={!nextStep.trim()}>
            Save checkpoint
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Notice glyph="⟲">Pausing an interest never creates overdue work. The checkpoint keeps source locations as references and your conversation context.</Notice>
        <Field label="Topic">
          <TextInput value={topic} onChange={(event) => setTopic(event.target.value)} />
        </Field>
        <Field label="What is understood">
          <TextArea rows={3} value={understood} onChange={(event) => setUnderstood(event.target.value)} />
        </Field>
        <Field label="What remains unclear">
          <TextArea rows={2} value={openQuestion} onChange={(event) => setOpenQuestion(event.target.value)} />
        </Field>
        <Field label="Next useful step">
          <TextArea rows={2} value={nextStep} onChange={(event) => setNextStep(event.target.value)} />
        </Field>
        {generated ? <span className="muted small">Drafted by AI · your edits are what future resumption uses.</span> : null}
      </div>
    </SidePanel>
  )
}
