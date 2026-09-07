import { useCallback, useState } from 'react'
import { requestBreakdown } from './goalsApi'
import type { BreakdownSuggestion } from './types'

/** AI breakdown suggestions are stored separately until accepted. */
export function useBreakdown(goalId: string | undefined) {
  const [suggestions, setSuggestions] = useState<BreakdownSuggestion[] | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')

  const request = useCallback(async () => {
    if (!goalId) return
    setState('loading')
    try {
      const result = await requestBreakdown(goalId)
      setSuggestions(result)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [goalId])

  const decide = useCallback((id: string, decision: 'accepted' | 'rejected') => {
    setSuggestions((current) => current?.map((item) => (item.id === id ? { ...item, decision } : item)) ?? null)
  }, [])

  return { suggestions, state, request, decide }
}
