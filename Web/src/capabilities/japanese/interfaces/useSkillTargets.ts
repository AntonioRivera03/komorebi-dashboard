import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listSkillTargets } from './japaneseApi'

export function useSkillTargets() {
  return useSnapshotQuery('japanese:targets', listSkillTargets)
}
