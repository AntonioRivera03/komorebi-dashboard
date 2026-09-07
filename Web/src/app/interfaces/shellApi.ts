import { wait } from '../../shared/api/mock'

export type ShellStatus = {
  home: 'linked' | 'linking' | 'stale' | 'unavailable'
  homeDetail: string
  ai: 'ready' | 'checking' | 'budget' | 'unavailable'
  aiDetail: string
  calendar: 'synced' | 'checking' | 'stale' | 'reconnect'
  calendarDetail: string
}

/** GET /api/v1/status — aggregated, non-secret provider state for the shell. */
export async function fetchShellStatus(): Promise<ShellStatus> {
  await wait(400)
  return {
    home: 'linked',
    homeDetail: 'Subscription live · snapshot reconciled 2 min ago',
    ai: 'ready',
    aiDetail: 'Monthly budget 38% used · cloud disclosure allowed for notes',
    calendar: 'synced',
    calendarDetail: 'Read-only · last cursor 6 min ago',
  }
}
