import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getPrivateSummary } from './financeApi'

export function useFinanceSummary() {
  return useSnapshotQuery('finance:summary', getPrivateSummary)
}
