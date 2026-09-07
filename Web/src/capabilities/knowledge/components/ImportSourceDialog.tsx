import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextInput } from '../../../shared/ui/TextInput'
import { Notice } from '../../../shared/ui/Notice'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { useOperation } from '../../../shared/hooks/useOperation'
import { newId } from '../../../shared/api/mock'
import { importSource } from '../interfaces/knowledgeApi'
import type { ImportDraft, Source, SourceKind } from '../interfaces/types'

type Props = { open: boolean; onClose: () => void; onImported: (source: Source) => void }

export function ImportSourceDialog({ open, onClose, onImported }: Props) {
  const [draft, setDraft] = useState<ImportDraft>({ kind: 'url', title: '', location: '' })
  const [key, setKey] = useState(() => newId('idem'))
  const run = useOperation(importSource)

  const submit = async () => {
    const result = await run.run(draft, key)
    if (result.status === 'completed') {
      onImported(result.value)
      setDraft({ kind: 'url', title: '', location: '' })
      setKey(newId('idem'))
      run.reset()
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Knowledge · L01"
      title="Import a source"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} busy={run.busy} disabled={!draft.location.trim()}>
            Import and extract
          </Button>
        </>
      }
    >
      <div className="k-form">
        <SegmentedControl<SourceKind> label="Kind" value={draft.kind} onChange={(kind) => setDraft({ ...draft, kind, location: '' })} options={[{ value: 'url', label: 'URL' }, { value: 'text', label: 'Text / Markdown' }, { value: 'pdf', label: 'PDF' }]} />
        <Field label="Title" hint="optional; extracted if blank">
          <TextInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </Field>
        {draft.kind === 'text' ? (
          <Field label="Text">
            <TextArea rows={6} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Paste text or Markdown" />
          </Field>
        ) : draft.kind === 'url' ? (
          <Field label="URL" hint="public addresses only">
            <TextInput mono value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="https://" />
          </Field>
        ) : (
          <Field label="File" hint="text-based PDF">
            <TextInput type="file" accept="application/pdf" onChange={(event) => setDraft({ ...draft, location: event.target.files?.[0]?.name ?? '' })} />
          </Field>
        )}
        <Field label="Author" hint="optional">
          <TextInput value={draft.author ?? ''} onChange={(event) => setDraft({ ...draft, author: event.target.value })} />
        </Field>
        <Notice glyph="※">Scanned or encrypted PDFs, video and OCR are later adapters. The original is always preserved with its metadata; extraction runs as a job you can retry.</Notice>
        <OperationBanner state={run.state} onRetry={submit} />
      </div>
    </Dialog>
  )
}
