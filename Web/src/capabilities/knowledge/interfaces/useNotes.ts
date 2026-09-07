import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listNotes } from './knowledgeApi'

export function useNotes() {
  return useSnapshotQuery('knowledge:notes', listNotes)
}
