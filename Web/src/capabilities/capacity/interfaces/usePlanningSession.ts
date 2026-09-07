import { useCallback, useState } from 'react'
import { createPlanningSession, recordDecision } from './capacityApi'
import type { PlanningInput, PlanningSession } from './types'

export function usePlanningSession() {
  const [session, setSession] = useState<PlanningSession | null>(null)
  const [loading, setLoading] = useState(false)

  const plan = useCallback(async (input: PlanningInput) => {
    setLoading(true)
    const result = await createPlanningSession(input)
    setLoading(false)
    if (result.status === 'completed') setSession(result.value)
  }, [])

  const decide = useCallback(
    async (candidateId: string, decision: 'accepted' | 'dismissed' | 'scheduled') => {
      if (!session) return
      setSession({ ...session, candidates: session.candidates.map((item) => (item.id === candidateId ? { ...item, decision } : item)) })
      await recordDecision(session.id, candidateId, decision)
    },
    [session],
  )

  return { session, loading, plan, decide }
}
