import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { getSource } from './knowledgeApi'

export function useSource(id: string | undefined) {
  return useSnapshotQuery(`knowledge:source:${id}`, async () => {
    if (!id) throw new Error('No source selected')
    const result = await getSource(id)
    if (!result) throw new Error('Source not found or access denied')
    return result
  })
}
