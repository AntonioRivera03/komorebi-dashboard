import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { queryUsage } from './usageApi'

export function useUsage(window: '7d' | '30d', capability?: string) {
  return useSnapshotQuery(`usage:${window}:${capability ?? 'all'}`, () => queryUsage(window, capability))
}
