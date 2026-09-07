import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listRules } from './automationApi'

export function useRules() {
  return useSnapshotQuery('automation:rules', listRules)
}
