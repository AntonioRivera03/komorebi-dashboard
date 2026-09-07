import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getBriefing } from './briefingsApi'

export function useBriefing() {
  return useSnapshotQuery('briefings:current', getBriefing)
}
