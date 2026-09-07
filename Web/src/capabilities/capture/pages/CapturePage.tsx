import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Tabs } from '../../../shared/ui/Tabs'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { Notice } from '../../../shared/ui/Notice'
import { routes } from '../../../shared/lib/routes'
import { useInbox } from '../interfaces/useInbox'
import { getCapture } from '../interfaces/captureApi'
import type { CaptureItem, CaptureState } from '../interfaces/types'
import { CaptureComposer } from '../components/CaptureComposer'
import { CaptureDetailPanel } from '../components/CaptureDetailPanel'
import { CaptureRow } from '../components/CaptureRow'

export default function CapturePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<CaptureState>('unprocessed')
  const [selected, setSelected] = useState<CaptureItem | null>(null)
  const query = useInbox(state)

  useEffect(() => {
    if (!id) {
      setSelected(null)
      return
    }
    let active = true
    getCapture(id).then((item) => active && setSelected(item))
    return () => {
      active = false
    }
  }, [id])

  const onChanged = (item: CaptureItem) => {
    setSelected(item)
    query.mutate((items) => (item.state === state ? items.map((current) => (current.id === item.id ? item : current)) : items.filter((current) => current.id !== item.id)))
  }

  return (
    <div className="k-page">
      <PageHeader eyebrow="Planning · P01" title="Capture" subtitle="One place to put things before deciding where they belong. Originals are preserved until you deliberately delete them." />
      <div className="k-grid k-grid--sidebar">
        <section>
          <CaptureComposer
            onCaptured={(item) => {
              if (state === 'unprocessed') query.mutate((items) => [item, ...items])
              else setState('unprocessed')
            }}
          />
          <Tabs
            label="Capture state"
            active={state}
            onChange={setState}
            tabs={[
              { id: 'unprocessed', label: 'Inbox' },
              { id: 'converted', label: 'Converted' },
              { id: 'archived', label: 'Archived' },
            ]}
          />
          <AsyncPanel
            query={query}
            isEmpty={(items) => items.length === 0}
            empty={
              <EmptyState glyph="○" title={state === 'unprocessed' ? 'Inbox is clear' : `Nothing ${state}`}>
                {state === 'unprocessed' ? 'Anything you capture lands here first. Voice, the briefing and the assistant can add to it too.' : 'Items move here once you act on them.'}
              </EmptyState>
            }
            skeletonLines={5}
          >
            {(snapshot) => (
              <>
                {snapshot.data.map((item) => (
                  <CaptureRow key={item.id} item={item} onOpen={(current) => navigate(`${routes.capture}/${current.id}`)} />
                ))}
                <div className="k-row k-row--between" style={{ marginTop: 14 }}>
                  <span className="muted small mono">{snapshot.data.length} items</span>
                  <FreshnessBadge freshness={snapshot.freshness} observedAt={snapshot.observedAt} />
                </div>
              </>
            )}
          </AsyncPanel>
        </section>
        <aside className="k-stack">
          <Notice glyph="✎">AI reads each capture with your existing context and suggests a destination. Suggestions, your edits and the accepted or rejected result are all persisted.</Notice>
          <Notice glyph="↻">A conversion that loses its response can be retried with the same conversion ID. Exactly one task or note results.</Notice>
          <Notice glyph="🎙">Voice captures keep a transcript reference for provenance.</Notice>
        </aside>
      </div>
      <CaptureDetailPanel item={selected} onClose={() => navigate(routes.capture)} onChanged={onChanged} />
    </div>
  )
}
