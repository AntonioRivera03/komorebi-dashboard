import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getSettings } from './settingsApi'

export function useSettings() {
  return useSnapshotQuery('settings:all', getSettings)
}
