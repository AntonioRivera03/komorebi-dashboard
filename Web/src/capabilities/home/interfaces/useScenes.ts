import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listScenes } from './homeApi'

export function useScenes() {
  return useSnapshotQuery('home:scenes', listScenes)
}
