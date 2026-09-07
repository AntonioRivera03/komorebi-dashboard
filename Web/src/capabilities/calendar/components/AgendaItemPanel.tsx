import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { LifecycleTrail } from '../../../shared/ui/LifecycleTrail'
import { ResourceChip } from '../../../shared/ui/ResourceChip'
import { Notice } from '../../../shared/ui/Notice'
import { Dialog } from '../../../shared/ui/Dialog'
import { formatLongDay, formatTime } from '../../../shared/lib/format'
import type { AgendaItem } from '../interfaces/types'
import styles from '../calendar.module.css'

const steps = [
  { id: 'proposed', label: 'proposed' },
  { id: 'confirmed', label: 'confirmed' },
  { id: 'queued', label: 'queued' },
  { id: 'sending', label: 'sending' },
  { id: 'synced', label: 'synced' },
]

type Props = { item: AgendaItem | null; onClose: () => void; onCancel: (item: AgendaItem, scope: 'occurrence' | 'series') => void }

export function AgendaItemPanel({ item, onClose, onCancel }: Props) {
  const [scopeAsk, setScopeAsk] = useState(false)
  const exception = item?.lifecycle && ['conflict', 'failed', 'unknown_outcome', 'canceled'].includes(item.lifecycle)
  return (
    <SidePanel
      open={item !== null}
      onClose={onClose}
      eyebrow={item ? (item.kind === 'provider' ? `Provider event · ${item.calendar}` : 'Internal block · linked to a task') : ''}
      title={item?.title ?? ''}
      footer={
        item && item.kind === 'block' && item.lifecycle !== 'canceled' ? (
          <Button variant="danger" onClick={() => (item.recurring ? setScopeAsk(true) : onCancel(item, 'occurrence'))}>
            Cancel block
          </Button>
        ) : item?.kind === 'provider' ? (
          <span className="muted small">Provider events are read-only in this slice. Fixed commitments are never moved to make room for flexible work.</span>
        ) : null
      }
    >
      {item ? (
        <>
          {item.conflict ? <Notice tone="warn" glyph="!">{item.conflict}</Notice> : null}
          <dl className={styles.detailList}>
            <dt>When</dt>
            <dd>
              {formatLongDay(item.start)} · {item.allDay ? 'all day' : `${formatTime(item.start)}–${formatTime(item.end)}`}
            </dd>
            <dt>Time zone</dt>
            <dd className="mono">{item.timeZone}</dd>
            {item.location ? (
              <>
                <dt>Where</dt>
                <dd>{item.location}</dd>
              </>
            ) : null}
            {item.providerRevision ? (
              <>
                <dt>Provider rev</dt>
                <dd className="mono">{item.providerRevision}</dd>
              </>
            ) : null}
            {item.recurring ? (
              <>
                <dt>Recurrence</dt>
                <dd>Series · edits ask whether they affect one occurrence or the series</dd>
              </>
            ) : null}
            {item.taskRef ? (
              <>
                <dt>Task</dt>
                <dd>
                  <ResourceChip resource={item.taskRef} to={`/tasks/${item.taskRef.id}`} />
                </dd>
              </>
            ) : null}
          </dl>
          {item.kind === 'block' && item.lifecycle ? (
            <>
              <span className="label">External write lifecycle</span>
              <div style={{ marginTop: 8 }}>
                <LifecycleTrail steps={steps} current={item.lifecycle} exception={exception ? { label: item.lifecycle.replace('_', ' '), tone: item.lifecycle === 'failed' ? 'failed' : 'warn' } : undefined} />
              </div>
              <p className="muted small" style={{ marginTop: 12 }}>
                The block is saved locally regardless of provider state. Ending the block never completes the linked task.
              </p>
            </>
          ) : (
            <StatusPill>authoritative for its external fields</StatusPill>
          )}
        </>
      ) : null}
      <Dialog open={scopeAsk} onClose={() => setScopeAsk(false)} title="Cancel one occurrence or the series?" eyebrow="Recurring">
        <div className="k-stack">
          <Button block onClick={() => { setScopeAsk(false); if (item) onCancel(item, 'occurrence') }}>Only this occurrence</Button>
          <Button block variant="soft" onClick={() => { setScopeAsk(false); if (item) onCancel(item, 'series') }}>The whole series</Button>
        </div>
      </Dialog>
    </SidePanel>
  )
}
