import { createContext } from 'react'
import type { Principal } from '../../shared/contracts/common'

export type Session = { actorId: string; displayName: string; householdId: string; principal: Principal; scopes: readonly string[] }
export type SessionApi = { session: Session; switchRole: (principal: 'user' | 'display') => void }
export const SessionContext = createContext<SessionApi | null>(null)
