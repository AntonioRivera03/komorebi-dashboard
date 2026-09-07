import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getToday } from './todayApi'

export function useToday() {
  return useSnapshotQuery('today:dashboard', getToday)
}
