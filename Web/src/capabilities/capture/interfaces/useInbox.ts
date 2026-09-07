import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listInbox } from './captureApi'
import type { CaptureState } from './types'

export function useInbox(state: CaptureState) {
  return useSnapshotQuery(`capture:inbox:${state}`, () => listInbox(state))
}
