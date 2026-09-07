import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getGoal } from './goalsApi'

export function useGoal(id: string | undefined) {
  return useSnapshotQuery(`goals:detail:${id}`, async () => {
    if (!id) throw new Error('No goal selected')
    const result = await getGoal(id)
    if (!result) throw new Error('Goal not found')
    return result
  })
}
