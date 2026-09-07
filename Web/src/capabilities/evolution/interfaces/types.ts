export type CandidateStatus = 'proposed' | 'evaluating' | 'accepted' | 'rejected' | 'applied' | 'measured'
export type ChangeType = 'assistance' | 'ui' | 'prompt' | 'behavior' | 'code'

export type ImprovementCandidate = {
  id: string
  title: string
  problem: string
  hypothesis: string
  changeType: ChangeType
  affected: string[]
  expectedBenefit: string
  measurement: string
  rollback?: string
  status: CandidateStatus
  authority: 'assistance_auto' | 'requires_approval' | 'pending_brief'
  evidence: { ref: string; kind: 'usage' | 'feedback' | 'chat'; excerpt: string; route?: string }[]
  evaluation?: { criteria: { name: string; baseline: string; result?: string; met?: boolean }[]; note: string; at: string }
  decision?: { by: string; at: string; note: string }
  outcome?: { baseline: string; observed: string; window: string; conclusion: string }
  createdAt: string
}
