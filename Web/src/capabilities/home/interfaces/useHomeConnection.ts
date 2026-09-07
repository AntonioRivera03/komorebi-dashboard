import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getConnection } from './homeApi'

export function useHomeConnection() {
  return useSnapshotQuery('home:connection', getConnection)
}
