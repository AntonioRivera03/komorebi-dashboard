import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getNote } from './knowledgeApi'

export function useNote(id: string | undefined) {
  return useSnapshotQuery(`knowledge:note:${id}`, async () => {
    if (!id) throw new Error('No note selected')
    const result = await getNote(id)
    if (!result) throw new Error('Note not found or access denied')
    return result
  })
}
