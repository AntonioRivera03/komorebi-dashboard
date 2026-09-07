import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listAlerts } from './homeAlertsApi'

export function useAlerts() {
  return useSnapshotQuery('home-alerts:list', listAlerts)
}
