import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listGoals } from './goalsApi'

export function useGoals() {
  return useSnapshotQuery('goals:list', listGoals)
}
