import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getReviewSummary } from './reviewsApi'

export function useReviewSummary() {
  return useSnapshotQuery('reviews:summary', getReviewSummary)
}
