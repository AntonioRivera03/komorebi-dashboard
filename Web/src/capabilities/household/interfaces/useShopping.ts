import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listShopping } from './householdApi'

export function useShopping(listId: string) {
  return useSnapshotQuery(`household:shopping:${listId}`, () => listShopping(listId))
}
