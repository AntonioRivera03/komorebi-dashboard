import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listSources } from './knowledgeApi'

export function useSources() {
  return useSnapshotQuery('knowledge:sources', listSources)
}
