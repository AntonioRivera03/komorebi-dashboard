import { useMemo, type ReactNode } from 'react'
import { useLocalStorageState } from '../../shared/hooks/useLocalStorageState'
import { SessionContext, type SessionApi } from './SessionContext'

/*
 * Session status is owned by the shell (K01). Until the server session exists
 * this reflects a mock owner session so display-scope behaviour can be exercised.
 */
const ownerScopes = ['*'] as const
const displayScopes = ['calendar:summary', 'home:scenes', 'today:display'] as const

export function SessionProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useLocalStorageState<'user' | 'display'>('komorebi.session.principal', 'user')

  const api = useMemo<SessionApi>(
    () => ({
      session: { actorId: 'usr_owner', displayName: 'Antonio', householdId: 'hh_apartment', principal, scopes: principal === 'user' ? ownerScopes : displayScopes },
      switchRole: setPrincipal,
    }),
    [principal, setPrincipal],
  )

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>
}
