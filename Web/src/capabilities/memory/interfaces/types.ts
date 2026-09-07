export type MemoryType = 'stated_fact' | 'stated_preference' | 'inferred_pattern' | 'working_summary'
export type MemoryStatus = 'active' | 'superseded' | 'suppressed' | 'conflicted'

export type MemoryEvidence = { id: string; ref: string; kind: 'conversation' | 'usage' | 'feature'; excerpt: string; at: string; route?: string; valid: boolean }

export type MemoryItem = {
  id: string
  type: MemoryType
  statement: string
  status: MemoryStatus
  confidence?: { label: string; note: string }
  validFrom: string
  validTo?: string
  lastAppliedAt?: string
  appliedCount: number
  extractorVersion: string
  provenance: 'explicit' | 'inferred' | 'confirmed'
  evidence: MemoryEvidence[]
  counts?: { observed: number; window: string }
  conflict?: { with: string; note: string }
  revision: number
}
