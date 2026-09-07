import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listExams } from './examsApi'

export function useExams() {
  return useSnapshotQuery('exams:list', listExams)
}
