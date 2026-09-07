import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listPeople } from './relationshipsApi'

export function usePeople() {
  return useSnapshotQuery('relationships:list', listPeople)
}
