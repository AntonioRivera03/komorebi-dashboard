import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listSubscriptions } from './briefingsApi'

export function useSubscriptions() {
  return useSnapshotQuery('briefings:subscriptions', listSubscriptions)
}
