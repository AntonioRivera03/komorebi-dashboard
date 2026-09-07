import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listHabits } from './habitsApi'

export function useHabits() {
  return useSnapshotQuery('habits:list', listHabits)
}
