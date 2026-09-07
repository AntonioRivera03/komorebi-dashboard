import { useContext } from 'react'
import { SessionContext } from './SessionContext'

export function useSession() {
  const api = useContext(SessionContext)
  if (!api) throw new Error('useSession must be used within SessionProvider')
  return api
}
