import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { Select } from '../../../shared/ui/Select'
import { TextInput } from '../../../shared/ui/TextInput'
import { useNotes } from '../interfaces/useNotes'
import type { RelationType } from '../interfaces/types'

type Props = { open: boolean; noteId: string; onClose: () => void; onAdd: (type: RelationType, targetId: string, why: string) => void; busy?: boolean }

export function AddRelationDialog({ open, noteId, onClose, onAdd, busy }: Props) {
  const notes = useNotes()
  const [type, setType] = useState<RelationType>('related')
  const [target, setTarget] = useState('')
  const [why, setWhy] = useState('')
  const options = (notes.snapshot?.data ?? []).filter((note) => note.id !== noteId).map((note) => ({ value: note.id, label: note.title }))
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Typed relationship"
      title="Link two notes"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!target || !why.trim()} busy={busy} onClick={() => onAdd(type, target, why)}>
            Add relation
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Relationship">
          <Select value={type} onChange={(event) => setType(event.target.value as RelationType)} options={[{ value: 'prerequisite', label: 'Prerequisite' }, { value: 'example', label: 'Example' }, { value: 'contrast', label: 'Contrast' }, { value: 'related', label: 'Related idea' }]} />
        </Field>
        <Field label="Target note">
          <Select value={target} onChange={(event) => setTarget(event.target.value)} options={[{ value: '', label: 'Choose a note…' }, ...options]} />
        </Field>
        <Field label="Why does this relationship exist?">
          <TextInput value={why} onChange={(event) => setWhy(event.target.value)} />
        </Field>
      </div>
    </Dialog>
  )
}
