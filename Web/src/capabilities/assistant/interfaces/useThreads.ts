import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { snapshot } from '../../../shared/api/mock'
import { listThreads } from './assistantApi'

export function useThreads() {
  return useSnapshotQuery('assistant:threads', async () => snapshot(await listThreads()))
}
