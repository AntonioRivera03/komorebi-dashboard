import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listThreads } from './conversationsApi'

export function useThreads(query: string, includeArchived: boolean) {
  return useSnapshotQuery(`conversations:list:${includeArchived}:${query}`, () => listThreads(query, includeArchived))
}
