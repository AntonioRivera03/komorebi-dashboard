import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getProfile } from './japaneseApi'

export function useLanguageProfile() {
  return useSnapshotQuery('japanese:profile', getProfile)
}
