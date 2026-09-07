import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getSession } from './studyApi'

export function useStudySession(id: string | undefined) {
  return useSnapshotQuery(`study:session:${id}`, async () => {
    if (!id) throw new Error('No session selected')
    const result = await getSession(id)
    if (!result) throw new Error('Session not found')
    return result
  })
}
