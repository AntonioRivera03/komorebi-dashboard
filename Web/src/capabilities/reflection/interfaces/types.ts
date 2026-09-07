export type ModuleSummary = { module: string; coverage: 'complete' | 'partial' | 'unavailable'; lines: string[]; freshness: string }
export type Adjustment = { id: string; label: string; owner: string; command: string; status: 'proposed' | 'accepted' | 'applied' | 'failed' }
export type Reflection = { weekKey: string; mattered: string; difficult: string; change: string; savedAt?: string; adjustments: Adjustment[]; aiDraft?: { text: string; basedOn: string[] } }
