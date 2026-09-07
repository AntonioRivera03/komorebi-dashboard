import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Divider } from '../../../shared/ui/Divider'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { TextArea } from '../../../shared/ui/TextArea'
import { ResourceChip } from '../../../shared/ui/ResourceChip'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { useToast } from '../../../shared/ui/useToast'
import { useOperation } from '../../../shared/hooks/useOperation'
import { formatDuration } from '../../../shared/lib/format'
import { newId } from '../../../shared/api/mock'
import { useTask } from '../interfaces/useTask'
import { cancelOccurrence, completeOccurrence, reopenOccurrence, updateTask } from '../interfaces/tasksApi'
import type { SeriesEditScope, Task } from '../interfaces/types'
import { EffortMeter } from './EffortMeter'
import { SeriesScopeDialog } from './SeriesScopeDialog'
import { TaskHistory } from './TaskHistory'
import styles from '../tasks.module.css'

type Props = { taskId: string | null; onClose: () => void; onChanged: (task: Task) => void }

export function TaskDetailPanel({ taskId, onClose, onChanged }: Props) {
  const query = useTask(taskId ?? undefined)
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [scopePrompt, setScopePrompt] = useState<null | 'update' | 'cancel'>(null)
  const update = useOperation(updateTask)
  const complete = useOperation(completeOccurrence)
  const reopen = useOperation(reopenOccurrence)
  const cancel = useOperation(cancelOccurrence)

  useEffect(() => {
    if (query.status === 'ready') {
      setDraftTitle(query.snapshot.data.task.title)
      setDraftDescription(query.snapshot.data.task.description ?? '')
    }
  }, [query.status, query.snapshot])

  const task = query.snapshot?.data.task

  const applyUpdate = async (scope: SeriesEditScope) => {
    if (!task) return
    const result = await update.run(task.id, { title: draftTitle, description: draftDescription }, task.revision, scope)
    if (result.status === 'completed') {
      setEditing(false)
      onChanged(result.value)
      query.reload()
      toast(scope === 'series' ? 'Series updated' : 'Task updated')
    }
  }

  const applyCancel = async (scope: SeriesEditScope) => {
    if (!task) return
    const result = await cancel.run(task.id, scope)
    if (result.status === 'completed') {
      onChanged(result.value)
      query.reload()
      toast('Canceled. Recorded in history; nothing was deleted.')
    }
  }

  const toggleComplete = async () => {
    if (!task) return
    const result = task.status === 'completed' ? await reopen.run(task.id) : await complete.run(task.id, newId('idem'))
    if (result.status === 'completed') {
      onChanged(result.value)
      query.reload()
    }
  }

  return (
    <SidePanel
      open={taskId !== null}
      onClose={onClose}
      eyebrow="Task"
      title={task ? task.title : 'Loading'}
      headerExtra={
        task ? (
          <div className="k-row" style={{ marginTop: 6 }}>
            <StatusPill tone={task.status === 'completed' ? 'ok' : task.status === 'in_progress' ? 'accent' : 'neutral'}>{task.status.replace('_', ' ')}</StatusPill>
            <span className="mono small muted">rev {task.revision}</span>
          </div>
        ) : null
      }
      footer={
        task ? (
          <>
            {task.status !== 'canceled' ? (
              <Button variant="danger" size="sm" onClick={() => (task.seriesId ? setScopePrompt('cancel') : applyCancel('occurrence'))} busy={cancel.busy}>
                Cancel task
              </Button>
            ) : null}
            <span style={{ flex: 1 }} />
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Discard
                </Button>
                <Button variant="primary" busy={update.busy} onClick={() => (task.seriesId ? setScopePrompt('update') : applyUpdate('occurrence'))}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button icon="edit" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="primary" busy={complete.busy || reopen.busy} onClick={toggleComplete} disabled={task.status === 'canceled'}>
                  {task.status === 'completed' ? 'Reopen' : 'Complete'}
                </Button>
              </>
            )}
          </>
        ) : null
      }
    >
      <AsyncPanel query={query} skeletonLines={5}>
        {({ data }) => (
          <>
            {editing ? (
              <div className="k-form">
                <Field label="Title">
                  <TextInput value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
                </Field>
                <Field label="Description">
                  <TextArea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} rows={4} />
                </Field>
                <OperationBanner state={update.state} onRetry={() => applyUpdate('occurrence')} />
              </div>
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{data.task.description ?? <span className="muted">No description.</span>}</p>
            )}
            <dl className={styles.detailGrid}>
              <div>
                <dt>Deadline</dt>
                <dd>{data.task.dueAt ? new Date(data.task.dueAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Undated'}</dd>
              </div>
              <div>
                <dt>Estimate</dt>
                <dd>{data.task.estimateMinutes ? formatDuration(data.task.estimateMinutes) : '—'}</dd>
              </div>
              <div>
                <dt>Effort</dt>
                <dd className="k-row">
                  <EffortMeter effort={data.task.effort} /> {data.task.effort ?? '—'}
                </dd>
              </div>
              <div>
                <dt>Context</dt>
                <dd>{data.task.context ? `#${data.task.context}` : '—'}</dd>
              </div>
              {data.series ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt>Recurrence</dt>
                  <dd>
                    {data.series.rule} · occurrence <span className="mono">{data.task.occurrenceKey}</span> · look-ahead {data.series.lookaheadDays} days
                  </dd>
                </div>
              ) : null}
              {data.task.originRef ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt>Requested by</dt>
                  <dd>
                    <ResourceChip resource={data.task.originRef} />
                  </dd>
                </div>
              ) : null}
            </dl>
            <OperationBanner state={complete.state} onRetry={toggleComplete} />
            <OperationBanner state={cancel.state} />
            <Divider label="History" />
            <TaskHistory history={data.history} />
          </>
        )}
      </AsyncPanel>
      <SeriesScopeDialog
        open={scopePrompt !== null}
        verb={scopePrompt === 'cancel' ? 'Cancel' : 'Update'}
        onClose={() => setScopePrompt(null)}
        onChoose={(scope) => {
          const kind = scopePrompt
          setScopePrompt(null)
          if (kind === 'cancel') applyCancel(scope)
          else applyUpdate(scope)
        }}
      />
    </SidePanel>
  )
}
