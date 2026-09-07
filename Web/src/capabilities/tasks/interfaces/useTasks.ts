import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listTasks } from './tasksApi'
import type { TaskFilter } from './types'

export function useTasks(filter: TaskFilter) {
  const key = `tasks:list:${filter.status}:${filter.context ?? ''}:${filter.due ?? ''}`
  return useSnapshotQuery(key, () => listTasks(filter))
}
