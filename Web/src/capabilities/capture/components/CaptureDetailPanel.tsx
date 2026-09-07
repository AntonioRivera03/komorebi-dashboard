import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { TextArea } from '../../../shared/ui/TextArea'
import { Divider } from '../../../shared/ui/Divider'
import { useToast } from '../../../shared/ui/useToast'
import { useOperation } from '../../../shared/hooks/useOperation'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { archiveCapture, convertCapture, rejectSuggestion, updateCapture } from '../interfaces/captureApi'
import type { CaptureItem, DestinationKind } from '../interfaces/types'
import { ConversionPreviewDialog } from './ConversionPreviewDialog'
import { ConversionStatus } from './ConversionStatus'
import { SuggestionCard } from './SuggestionCard'
import styles from '../capture.module.css'

type Props = { item: CaptureItem | null; onClose: () => void; onChanged: (item: CaptureItem) => void }

const destinations: { kind: DestinationKind; label: string; hint: string }[] = [
  { kind: 'task', label: 'Task', hint: 'something to do' },
  { kind: 'note', label: 'Concept note', hint: 'something you understand' },
  { kind: 'source', label: 'Source import', hint: 'something to read' },
]

export function CaptureDetailPanel({ item, onClose, onChanged }: Props) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState('')
  const [destination, setDestination] = useState<DestinationKind | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const update = useOperation(updateCapture)
  const archive = useOperation(archiveCapture)
  const convert = useOperation(convertCapture)

  useEffect(() => {
    setBody(item?.body ?? '')
    setEditing(false)
    setDestination(item?.conversion?.destinationKind ?? null)
    setPreviewing(false)
    convert.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  const save = async () => {
    if (!item) return
    const result = await update.run(item.id, body, item.revision)
    if (result.status === 'completed') {
      onChanged(result.value)
      setEditing(false)
      toast('Original updated')
    }
  }

  const runConversion = async (kind: DestinationKind) => {
    if (!item) return
    const result = await convert.run(item.id, kind)
    setPreviewing(false)
    if (result.status === 'completed') {
      onChanged(result.value)
      toast(result.value.conversion?.status === 'completed' ? `Converted to ${kind} · original kept` : 'Conversion failed · capture preserved', { tone: result.value.conversion?.status === 'completed' ? 'neutral' : 'warn' })
    }
  }

  const doArchive = async () => {
    if (!item) return
    const result = await archive.run(item.id)
    if (result.status === 'completed') {
      onChanged(result.value)
      toast('Archived. Archive is not deletion.')
      onClose()
    }
  }

  return (
    <SidePanel
      open={item !== null}
      onClose={onClose}
      eyebrow={item ? `Capture · ${item.id} · rev ${item.revision}` : ''}
      title={item ? (item.kind === 'url' ? 'Link' : item.kind === 'file' ? 'File reference' : 'Thought') : ''}
      headerExtra={
        item ? (
          <div className="k-row" style={{ marginTop: 6 }}>
            <StatusPill tone={item.state === 'converted' ? 'ok' : item.state === 'archived' ? 'neutral' : 'accent'}>{item.state}</StatusPill>
            <span className="muted small">via {item.origin}{item.transcriptRef ? ` · transcript ${item.transcriptRef}` : ''}</span>
          </div>
        ) : null
      }
      footer={
        item ? (
          <>
            {item.state === 'unprocessed' ? (
              <Button variant="ghost" onClick={doArchive} busy={archive.busy}>
                Archive
              </Button>
            ) : null}
            <span style={{ flex: 1 }} />
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Discard
                </Button>
                <Button variant="primary" onClick={save} busy={update.busy}>
                  Save original
                </Button>
              </>
            ) : (
              <Button icon="edit" onClick={() => setEditing(true)}>
                Edit original
              </Button>
            )}
          </>
        ) : null
      }
    >
      {item ? (
        <div className="k-stack" style={{ gap: 18 }}>
          {editing ? <TextArea value={body} onChange={(event) => setBody(event.target.value)} rows={5} aria-label="Original" /> : <p className={styles.original}>{item.body}</p>}
          <OperationBanner state={update.state} onRetry={save} />
          {item.attachmentRefs.length ? (
            <div className="k-row">
              {item.attachmentRefs.map((ref) => (
                <span key={ref} className="k-ref">
                  <span className="k-ref__owner">files</span> · {ref}
                </span>
              ))}
            </div>
          ) : null}

          <SuggestionCard
            item={item}
            onAccept={(kind) => {
              setDestination(kind)
              setPreviewing(true)
            }}
            onReject={async () => {
              const result = await rejectSuggestion(item.id)
              if (result.status === 'completed') onChanged(result.value)
            }}
          />

          {item.state === 'unprocessed' && item.conversion?.status !== 'completed' ? (
            <>
              <Divider label="Choose a destination" />
              <div className={styles.chips} role="group" aria-label="Destination">
                {destinations.map((option) => (
                  <button key={option.kind} type="button" className={styles.chip} aria-pressed={destination === option.kind} onClick={() => setDestination(option.kind)} title={option.hint}>
                    {option.label}
                  </button>
                ))}
              </div>
              <Button variant="primary" disabled={!destination} onClick={() => setPreviewing(true)} icon="arrow-right">
                Preview conversion
              </Button>
            </>
          ) : null}

          {item.conversion ? (
            <>
              <Divider label="Conversion" />
              <ConversionStatus conversion={item.conversion} busy={convert.busy} onRetry={() => runConversion(item.conversion?.destinationKind ?? 'task')} />
            </>
          ) : null}
          <OperationBanner state={convert.state} />
        </div>
      ) : null}
      <ConversionPreviewDialog captureId={previewing && item ? item.id : null} destination={previewing ? destination : null} busy={convert.busy} onConfirm={() => destination && runConversion(destination)} onClose={() => setPreviewing(false)} />
    </SidePanel>
  )
}
