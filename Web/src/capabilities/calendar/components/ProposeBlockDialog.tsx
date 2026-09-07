import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { Select } from '../../../shared/ui/Select'
import { Notice } from '../../../shared/ui/Notice'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { formatLongDay, formatTime } from '../../../shared/lib/format'
import { proposeBlock } from '../interfaces/calendarApi'
import type { BlockProposal } from '../interfaces/types'
import styles from '../calendar.module.css'

type Props = { start: string | null; onClose: () => void; onProposal: (proposal: BlockProposal | null) => void; onConfirm: (proposal: BlockProposal) => void; busy?: boolean }

const taskOptions = [
  { value: 'tsk_1|Outline chapter 4 recall prompts|45', label: 'Outline chapter 4 recall prompts · 45 min' },
  { value: 'tsk_9|Read: Attention and working memory|35', label: 'Read: Attention and working memory · 35 min' },
  { value: 'tsk_2|Book dentist appointment|10', label: 'Book dentist appointment · 10 min' },
  { value: 'tsk_6|Practise self-introduction (Japanese)|20', label: 'Practise self-introduction · 20 min' },
]

/** Preview conflicts and alternatives before anything is written. */
export function ProposeBlockDialog({ start, onClose, onProposal, onConfirm, busy }: Props) {
  const [task, setTask] = useState(taskOptions[0].value)
  const [when, setWhen] = useState(start ?? '')
  const [duration, setDuration] = useState(45)
  const [proposal, setProposal] = useState<BlockProposal | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (start) {
      setWhen(start)
      setProposal(null)
      setDuration(Number(task.split('|')[2]))
    }
  }, [start, task])

  useEffect(() => {
    if (!start || !when) return
    let active = true
    setLoading(true)
    const [taskId, taskTitle] = task.split('|')
    proposeBlock(taskId, taskTitle, when, duration).then((result) => {
      if (!active) return
      setLoading(false)
      if (result.status === 'completed') {
        setProposal(result.value)
        onProposal(result.value)
      }
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, when, duration, task])

  return (
    <Dialog
      open={start !== null}
      onClose={() => {
        onProposal(null)
        onClose()
      }}
      eyebrow="Calendar · proposeBlock"
      title="Schedule a task block"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onProposal(null); onClose() }}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!proposal || loading} busy={busy} onClick={() => proposal && onConfirm(proposal)}>
            {proposal?.conflicts.length ? 'Confirm anyway' : 'Confirm block'}
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Task" hint="read through Tasks">
          <Select value={task} onChange={(event) => setTask(event.target.value)} options={taskOptions} />
        </Field>
        <div className="k-form-row">
          <Field label="Start">
            <TextInput type="datetime-local" value={when ? new Date(new Date(when).getTime() - new Date(when).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ''} onChange={(event) => setWhen(new Date(event.target.value).toISOString())} />
          </Field>
          <Field label="Duration" hint="minutes">
            <TextInput type="number" min={10} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </Field>
        </div>
        {loading || !proposal ? (
          <Skeleton lines={2} />
        ) : (
          <>
            <p style={{ fontSize: 13 }}>
              {formatLongDay(proposal.start)} · {formatTime(proposal.start)}–{formatTime(proposal.end)} · <span className="mono muted">{proposal.timeZone}</span>
            </p>
            {proposal.conflicts.length === 0 ? (
              <Notice tone="ok" glyph="✓">No conflict with provider events in the fresh mirror.</Notice>
            ) : (
              <>
                <Notice tone="warn" glyph="!">
                  Overlaps {proposal.conflicts.map((conflict) => `${conflict.with} (${conflict.overlapMinutes} min)`).join(', ')}. Fixed commitments are not moved.
                </Notice>
                <span className="label">Alternatives</span>
                {proposal.alternatives.map((alt) => (
                  <div key={alt.start} className={styles.alt}>
                    <span>
                      {formatLongDay(alt.start)} · {formatTime(alt.start)}–{formatTime(alt.end)} <span className="muted small">· {alt.reason}</span>
                    </span>
                    <Button size="sm" onClick={() => setWhen(alt.start)}>
                      Use
                    </Button>
                  </div>
                ))}
              </>
            )}
            <p className="muted small">Confirming saves an internal block. A provider write, if enabled, is queued and tracked separately; a timeout after send is reconciled, never blindly retried.</p>
          </>
        )}
      </div>
    </Dialog>
  )
}
