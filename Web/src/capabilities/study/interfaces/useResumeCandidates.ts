import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listResumeCandidates } from './studyApi'

export function useResumeCandidates() {
  return useSnapshotQuery('study:resume', listResumeCandidates)
}
