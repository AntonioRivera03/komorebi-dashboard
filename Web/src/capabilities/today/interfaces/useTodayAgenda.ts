import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { snapshot, wait, daysFromNow } from '../../../shared/api/mock'

export type AgendaEntry = { id: string; at: string; title: string; detail: string; kind: 'provider' | 'block' }

/** Bounded agenda contribution for Today (read through Calendar's public query). */
export function useTodayAgenda() {
  return useSnapshotQuery('today:agenda', async () => {
    await wait(260)
    return snapshot<AgendaEntry[]>([
      { id: 'blk_1', at: daysFromNow(0, 9, 30), title: 'Chapter 4 prompts', detail: 'internal block · task tsk_1', kind: 'block' },
      { id: 'evt_2', at: daysFromNow(0, 14, 30), title: 'Cognition seminar', detail: 'Room B2.14 · provider', kind: 'provider' },
      { id: 'blk_2', at: daysFromNow(0, 19, 30), title: 'Working memory: loop vs buffer', detail: 'internal block · proposed by assistant', kind: 'block' },
      { id: 'evt_3', at: daysFromNow(1, 8, 0), title: 'Easy run 5 km', detail: 'provider · personal calendar', kind: 'provider' },
    ])
  })
}
