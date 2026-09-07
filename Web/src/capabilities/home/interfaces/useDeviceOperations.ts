import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listOperations } from './homeApi'

export function useDeviceOperations() {
  return useSnapshotQuery('home:operations', listOperations)
}
