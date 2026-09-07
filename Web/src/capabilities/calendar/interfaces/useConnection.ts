import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getConnection } from './calendarApi'

export function useConnection() {
  return useSnapshotQuery('calendar:connection', getConnection)
}
