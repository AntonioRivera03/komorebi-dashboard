import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listMaintenance } from './householdApi'

export function useMaintenance() {
  return useSnapshotQuery('household:maintenance', listMaintenance)
}
