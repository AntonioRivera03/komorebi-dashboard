import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getWeek } from './reflectionApi'

export function useWeek() {
  return useSnapshotQuery('reflection:week', getWeek)
}
