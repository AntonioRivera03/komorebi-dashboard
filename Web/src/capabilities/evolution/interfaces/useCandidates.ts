import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listCandidates } from './evolutionApi'

export function useImprovementCandidates() {
  return useSnapshotQuery('evolution:candidates', listCandidates)
}
