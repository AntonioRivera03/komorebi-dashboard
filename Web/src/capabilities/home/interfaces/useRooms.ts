import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listRooms } from './homeApi'

export function useRooms() {
  return useSnapshotQuery('home:rooms', listRooms)
}
