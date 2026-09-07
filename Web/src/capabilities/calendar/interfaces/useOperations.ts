import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listOperations } from './calendarApi'

export function useOperations() {
  return useSnapshotQuery('calendar:operations', listOperations)
}
