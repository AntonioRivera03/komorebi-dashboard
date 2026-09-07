import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { snapshot } from '../../../shared/api/mock'
import { listRecentRequests } from './voiceApi'

export function useRecentRequests() {
  return useSnapshotQuery('voice:recent', async () => snapshot(await listRecentRequests()))
}
