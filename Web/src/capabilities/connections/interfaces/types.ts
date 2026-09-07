export type ConnectionCandidate = {
  id: string
  runId: string
  from: { noteId: string; title: string; revision: number; excerpt: string }
  to: { noteId: string; title: string; revision: number; excerpt: string }
  relation: 'prerequisite' | 'example' | 'contrast' | 'related'
  explanation: string
  kind: 'analogy' | 'equivalence'
  limitations: string[]
  evidence: { noteId: string; locator: string; passage: string }[]
  status: 'pending' | 'accepted' | 'dismissed' | 'stale' | 'promoting' | 'promotion_failed'
  createdAt: string
}

export type SuggestionRun = { id: string; at: string; candidates: number; model: string; status: 'completed' | 'failed' | 'no_candidates' }
