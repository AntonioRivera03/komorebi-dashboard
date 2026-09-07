import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { search } from './knowledgeApi'

export function useSearch(query: string, scope: 'all' | 'notes' | 'sources', topic?: string) {
  return useSnapshotQuery(`knowledge:search:${scope}:${topic ?? ''}:${query}`, () => search(query, scope, topic))
}
