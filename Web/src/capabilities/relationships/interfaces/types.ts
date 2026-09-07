export type Person = { id: string; name: string; note?: string; dates: { id: string; label: string; date: string; annual: boolean; leapPolicy?: 'feb28' | 'mar1' }[]; reminder?: { cadence: string; nextAt: string; taskRef?: string } }
export type ExperienceIdea = { id: string; title: string; withWhom?: string; season?: string; requested?: { kind: 'task' | 'calendar'; ref: string } }
