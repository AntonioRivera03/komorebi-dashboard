import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listSessions } from './studyApi'

export function useSessions() {
  return useSnapshotQuery('study:sessions', listSessions)
}
