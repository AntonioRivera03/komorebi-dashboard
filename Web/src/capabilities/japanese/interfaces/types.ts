export type SkillMode = 'listening' | 'reading' | 'writing' | 'speaking'

export type SkillTarget = {
  id: string
  title: string
  purpose: string
  level: string
  modes: SkillMode[]
  evidence: { attemptId: string; mode: SkillMode; assistance: 'independent' | 'hint' | 'reference'; outcome: 'met' | 'partial' | 'not_yet'; at: string }[]
  assessment?: { level: string; note: string; basis: string; at: string }
  lessonRefs: { title: string; locator: string; route: string }[]
  vocabularyRecall?: number
}

export type LanguageProfile = { purpose: string; startingLevel: string; speechProvider: 'ready' | 'unconfigured'; microphone: 'granted' | 'prompt' | 'denied' | 'unavailable' }

export type VocabCard = { id: string; word: string; reading: string; meaning: string; example: string }
