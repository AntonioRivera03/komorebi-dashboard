import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { listAgenda } from './calendarApi'

export function useAgenda(fromDay: number, days: number) {
  return useSnapshotQuery(`calendar:agenda:${fromDay}:${days}`, () => listAgenda(fromDay, days))
}
