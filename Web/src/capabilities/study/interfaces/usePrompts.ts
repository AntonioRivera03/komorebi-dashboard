import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listPrompts } from './studyApi'

export function usePrompts() {
  return useSnapshotQuery('study:prompts', listPrompts)
}
