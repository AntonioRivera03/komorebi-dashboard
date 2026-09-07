import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getTask } from './tasksApi'

export function useTask(id: string | undefined) {
  return useSnapshotQuery(`tasks:detail:${id ?? 'none'}`, async () => {
    if (!id) throw new Error('No task selected')
    const result = await getTask(id)
    if (!result) throw new Error('Task not found')
    return result
  })
}
