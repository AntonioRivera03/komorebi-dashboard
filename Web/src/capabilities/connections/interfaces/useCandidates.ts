import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listCandidates } from './connectionsApi'

export function useCandidates() {
  return useSnapshotQuery('connections:candidates', listCandidates)
}
