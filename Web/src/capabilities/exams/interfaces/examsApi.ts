import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ErrorLogEntry, Exam, PracticeRun } from './types'

/* Exams HTTP adapter (mock): /api/v1/exams/... */

let exams: Exam[] = [
  {
    id: 'exam_cog',
    title: 'Cognition module exam',
    date: daysFromNow(9, 10),
    format: '2 h written · 4 essay questions · 1 data interpretation',
    blueprintRevision: 2,
    rubricRevision: 3,
    topics: [
      { id: 't_mem', name: 'Memory models', weight: 35, coverage: 0.9, performance: 0.64, promptCount: 9, sourceCount: 3 },
      { id: 't_att', name: 'Attention', weight: 25, coverage: 0.6, performance: 0.55, promptCount: 4, sourceCount: 2 },
      { id: 't_per', name: 'Perception', weight: 20, coverage: 0.5, performance: undefined, promptCount: 2, sourceCount: 1 },
      { id: 't_met', name: 'Research methods', weight: 20, coverage: 0.25, performance: undefined, promptCount: 1, sourceCount: 1 },
    ],
    runs: [
      { id: 'pr_1', startedAt: minutesAgo(1600), timed: true, durationMinutes: 40, blueprintRevision: 2, rubricRevision: 3, sessionRef: 'ses_2', status: 'assessed', score: 32, maxScore: 50, reviewed: true },
      { id: 'pr_2', startedAt: minutesAgo(200), timed: false, blueprintRevision: 2, rubricRevision: 3, sessionRef: 'ses_x', status: 'awaiting_marking', reviewed: false },
    ],
    errors: [
      { id: 'err_1', topicId: 't_mem', question: 'What does the central executive do, and what does it not do?', mistake: 'Claimed it has storage; rubric criterion 2 explicitly requires “no storage of its own”.', repair: { kind: 'prompt', label: 'Draft prm_dual (dual-task interference)', ref: 'prm_dual', retested: false }, createdAt: minutesAgo(1500) },
      { id: 'err_2', topicId: 't_att', question: 'Predict distractor processing under high perceptual load.', mistake: 'Reversed the prediction (said more processing under high load).', createdAt: minutesAgo(1490) },
    ],
  },
  { id: 'exam_jlpt', title: 'JLPT N5 (tentative)', date: daysFromNow(90, 9), format: 'Multiple choice · vocabulary, grammar, reading, listening', blueprintRevision: 1, rubricRevision: 1, topics: [{ id: 't_vocab', name: 'Vocabulary', weight: 30, coverage: 0.3, promptCount: 12, sourceCount: 1 }, { id: 't_gram', name: 'Grammar', weight: 30, coverage: 0.1, promptCount: 2, sourceCount: 1 }, { id: 't_read', name: 'Reading', weight: 20, coverage: 0, promptCount: 0, sourceCount: 0 }, { id: 't_list', name: 'Listening', weight: 20, coverage: 0, promptCount: 0, sourceCount: 0 }], runs: [], errors: [] },
]

export async function listExams(): Promise<Snapshot<Exam[]>> {
  await wait()
  return snapshot(exams)
}

export async function getExam(id: string): Promise<Snapshot<Exam> | null> {
  await wait(200)
  const exam = exams.find((item) => item.id === id)
  return exam ? snapshot(exam) : null
}

export async function startPractice(examId: string, timed: boolean, durationMinutes?: number): Promise<Operation<PracticeRun>> {
  await wait(400)
  const exam = exams.find((item) => item.id === examId)
  if (!exam) return failedOperation('not_found', false)
  const run: PracticeRun = { id: newId('pr'), startedAt: nowIso(), timed, durationMinutes, blueprintRevision: exam.blueprintRevision, rubricRevision: exam.rubricRevision, sessionRef: newId('ses'), status: 'in_progress', reviewed: false }
  exam.runs = [run, ...exam.runs]
  return completed(run)
}

export async function reviewMarking(examId: string, runId: string): Promise<Operation<PracticeRun>> {
  await wait(700)
  const exam = exams.find((item) => item.id === examId)
  const run = exam?.runs.find((item) => item.id === runId)
  if (!run) return failedOperation('not_found', false)
  run.status = 'assessed'
  run.score = 28
  run.maxScore = 40
  run.reviewed = true
  return completed({ ...run })
}

export async function acceptRepair(examId: string, errorId: string, kind: 'task' | 'prompt' | 'activity'): Promise<Operation<ErrorLogEntry>> {
  await wait(350)
  const exam = exams.find((item) => item.id === examId)
  const entry = exam?.errors.find((item) => item.id === errorId)
  if (!entry) return failedOperation('not_found', false)
  entry.repair = { kind, label: kind === 'task' ? 'Task: re-read load theory and write a 3-line summary' : kind === 'prompt' ? 'Prompt draft: predict load effects in two scenarios' : 'Activity: 10-min explanation session on load theory', ref: newId(kind === 'task' ? 'tsk' : kind === 'prompt' ? 'prm' : 'ses'), retested: false }
  return completed({ ...entry })
}

export async function addTopic(examId: string, name: string, weight: number): Promise<Operation<Exam>> {
  await wait(220)
  const exam = exams.find((item) => item.id === examId)
  if (!exam) return failedOperation('not_found', false)
  exam.topics = [...exam.topics, { id: newId('t'), name, weight, coverage: 0, promptCount: 0, sourceCount: 0 }]
  exam.blueprintRevision += 1
  return completed({ ...exam })
}

export function keepExams() {
  return exams
}
