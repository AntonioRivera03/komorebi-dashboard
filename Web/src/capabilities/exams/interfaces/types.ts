export type SyllabusTopic = { id: string; name: string; weight: number; coverage: number; performance?: number; promptCount: number; sourceCount: number }

export type PracticeRun = { id: string; startedAt: string; timed: boolean; durationMinutes?: number; blueprintRevision: number; rubricRevision: number; sessionRef: string; status: 'in_progress' | 'awaiting_marking' | 'assessed'; score?: number; maxScore?: number; reviewed: boolean }

export type ErrorLogEntry = { id: string; topicId: string; question: string; mistake: string; repair?: { kind: 'task' | 'prompt' | 'activity'; label: string; ref: string; retested?: boolean }; createdAt: string }

export type Exam = {
  id: string
  title: string
  date: string
  format: string
  blueprintRevision: number
  rubricRevision: number
  topics: SyllabusTopic[]
  runs: PracticeRun[]
  errors: ErrorLogEntry[]
}
