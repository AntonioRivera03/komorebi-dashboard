import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { useToast } from '../../../shared/ui/useToast'
import { newId } from '../../../shared/api/mock'
import { routes } from '../../../shared/lib/routes'
import { useTasks } from '../interfaces/useTasks'
import { useTaskContexts } from '../interfaces/useTaskContexts'
import { completeOccurrence, reopenOccurrence } from '../interfaces/tasksApi'
import type { Task, TaskFilter } from '../interfaces/types'
import { TaskComposerDialog } from '../components/TaskComposerDialog'
import { TaskDetailPanel } from '../components/TaskDetailPanel'
import { TaskFilters } from '../components/TaskFilters'
import { TaskRow } from '../components/TaskRow'
import { TaskSummaryAside } from '../components/TaskSummaryAside'
import styles from '../tasks.module.css'

export default function TasksPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState<TaskFilter>({ status: 'open', due: 'any' })
  const [composing, setComposing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const contexts = useTaskContexts()
  const query = useTasks(filter)

  const toggle = async (task: Task) => {
    setBusyId(task.id)
    const result = task.status === 'completed' ? await reopenOccurrence(task.id) : await completeOccurrence(task.id, newId('idem'))
    setBusyId(null)
    if (result.status === 'completed') {
      query.mutate((tasks) => tasks.map((item) => (item.id === task.id ? result.value : item)))
      toast(task.status === 'completed' ? 'Reopened' : 'Completed · one occurrence fact recorded', { action: { label: 'Undo', onClick: () => toggle(result.value) } })
    } else if (result.status === 'failed') {
      toast(result.message ?? 'Could not update task', { tone: 'danger' })
    }
  }

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Planning · P03"
        title="Tasks"
        subtitle="Open work, recurrence and completion history. A scheduled block never completes a task by itself."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setComposing(true)}>
            New task
          </Button>
        }
      />
      <div className={styles.layout}>
        <section>
          <TaskFilters filter={filter} contexts={contexts} onChange={setFilter} />
          <AsyncPanel
            query={query}
            isEmpty={(tasks) => tasks.length === 0}
            empty={
              <EmptyState glyph="✓" title="Nothing here" action={<Button onClick={() => setComposing(true)}>Add a task</Button>}>
                No tasks match this filter. Captured intentions can be converted into tasks from the inbox.
              </EmptyState>
            }
            skeletonLines={6}
          >
            {(snapshot) => (
              <>
                {snapshot.data.map((task) => (
                  <TaskRow key={task.id} task={task} selected={task.id === id} busy={busyId === task.id} onOpen={(item) => navigate(`${routes.tasks}/${item.id}`)} onToggle={toggle} />
                ))}
                <div className={styles.foot}>
                  <span>{snapshot.data.length} shown · cursor pagination applies past 50</span>
                  <FreshnessBadge freshness={snapshot.freshness} observedAt={snapshot.observedAt} />
                </div>
              </>
            )}
          </AsyncPanel>
        </section>
        {query.snapshot ? <TaskSummaryAside tasks={query.snapshot.data} /> : null}
      </div>
      <TaskComposerDialog
        open={composing}
        onClose={() => setComposing(false)}
        contexts={contexts}
        onCreated={(task) => {
          query.reload()
          toast(`Created “${task.title}”`, { action: { label: 'Open', onClick: () => navigate(`${routes.tasks}/${task.id}`) } })
        }}
      />
      <TaskDetailPanel taskId={id ?? null} onClose={() => navigate(routes.tasks)} onChanged={(task) => query.mutate((tasks) => tasks.map((item) => (item.id === task.id ? task : item)))} />
    </div>
  )
}
