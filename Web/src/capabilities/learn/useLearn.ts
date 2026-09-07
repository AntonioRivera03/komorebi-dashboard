import { createContext, useContext } from 'react'
import type { LearnState } from './model'
import type { LearnConnection } from './useLearnStorage'

export type LearnContextValue = {
  state: LearnState
  update: (next: (current: LearnState) => LearnState) => void
  storageError: boolean
  connection?: LearnConnection
}
export const LearnContext = createContext<LearnContextValue | null>(null)
export function useLearn() {
  const value = useContext(LearnContext)
  if (!value) throw new Error('LearnProvider is required')
  return value
}
