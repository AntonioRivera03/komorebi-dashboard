import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getTrainingSummary } from './trainingApi'

export function useTrainingSummary() {
  return useSnapshotQuery('training:summary', getTrainingSummary)
}
