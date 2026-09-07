import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listMemory } from './memoryApi'

export function useMemory() {
  return useSnapshotQuery('memory:list', listMemory)
}
