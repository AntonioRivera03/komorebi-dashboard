import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getExam } from './examsApi'

export function useExam(id: string | undefined) {
  return useSnapshotQuery(`exams:detail:${id}`, async () => {
    if (!id) throw new Error('No exam selected')
    const result = await getExam(id)
    if (!result) throw new Error('Exam not found')
    return result
  })
}
