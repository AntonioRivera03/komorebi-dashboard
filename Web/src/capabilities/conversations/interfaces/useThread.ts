import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getThread } from './conversationsApi'

export function useThread(id: string | undefined) {
  return useSnapshotQuery(`conversations:thread:${id}`, async () => {
    if (!id) throw new Error('No thread selected')
    const result = await getThread(id)
    if (!result) throw new Error('Thread not found')
    return result
  })
}
