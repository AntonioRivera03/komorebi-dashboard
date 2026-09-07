import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ActivityKind, Assessment, Assistance, Attempt, Checkpoint, Prompt, StudySession } from './types'

/* Study HTTP adapter (mock): /api/v1/study/... */

let prompts: Prompt[] = [
  { id: 'prm_ce', revision: 2, status: 'approved', kind: 'recall', question: 'What does the central executive do, and what does it not do?', referenceAnswer: 'It is an attentional control system that allocates attention between the slave systems; it has no storage capacity of its own.', sourceRefs: [{ sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 418 §1', revision: 2 }], generatedBy: 'ai' },
  { id: 'prm_buffer', revision: 1, status: 'approved', kind: 'explanation', question: 'Explain in your own words why Baddeley added the episodic buffer.', referenceAnswer: 'To account for binding across the loop, sketchpad and LTM into integrated chunks; a limited-capacity store under executive control.', sourceRefs: [{ sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 421 §2', revision: 2 }, { sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 423 §1', revision: 2 }], generatedBy: 'ai' },
  { id: 'prm_loop', revision: 1, status: 'approved', kind: 'recall', question: 'Name the two components of the phonological loop.', referenceAnswer: 'A phonological store and an articulatory rehearsal process.', sourceRefs: [{ sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 419 §3', revision: 2 }], generatedBy: 'user' },
  { id: 'prm_dual', revision: 1, status: 'draft', kind: 'problem', question: 'A participant rehearses digits while tracking a moving dot. Predict the interference pattern and justify it with the model.', referenceAnswer: 'Little interference: the loop and sketchpad are separate; heavy interference would appear only if both tasks loaded the same subsystem or the executive.', sourceRefs: [{ sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 419 §3', revision: 2 }], generatedBy: 'ai' },
  { id: 'prm_old', revision: 1, status: 'flagged', kind: 'recall', question: 'How many chunks does the buffer hold?', sourceRefs: [{ sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 420', revision: 1 }], generatedBy: 'ai', flaggedReason: 'Source revision 2 changed page layout; locator p. 420 r1 no longer resolves.' },
  { id: 'prm_menu', revision: 1, status: 'approved', kind: 'communication', question: 'A waiter approaches. Get their attention and ask for the menu.', referenceAnswer: 'すみません、メニューをお願いします。', sourceRefs: [{ sourceId: 'src_irodori', sourceTitle: 'Irodori A2 — Unit 3', locator: 'Unit 3 · dialogue 2', revision: 1 }], generatedBy: 'user' },
]

let attempts: Attempt[] = [
  { id: 'att_88', promptId: 'prm_ce', promptRevision: 2, answer: 'It controls attention between the loop and the sketchpad. I think it also stores a little?', assistance: 'hint', submittedAt: minutesAgo(1390), assessments: [{ id: 'as_1', provenance: 'self', score: 2, maxScore: 5, at: minutesAgo(1388) }, { id: 'as_2', provenance: 'ai_draft', score: 2, maxScore: 5, feedback: 'The allocation part matches p. 418 §1. The claim that it stores is contradicted by the same passage: “no storage capacity of its own”.', citedLocators: ['p. 418 §1'], at: minutesAgo(1387), state: 'completed' }] },
  { id: 'att_89', promptId: 'prm_loop', promptRevision: 1, answer: 'Phonological store and articulatory rehearsal.', assistance: 'independent', submittedAt: minutesAgo(1380), assessments: [{ id: 'as_3', provenance: 'self', score: 5, maxScore: 5, at: minutesAgo(1379) }] },
]

let sessions: StudySession[] = [
  { id: 'ses_2', title: 'Chapter 4 · working memory', kind: 'recall', status: 'paused', startedAt: minutesAgo(1400), sourceTitle: 'Baddeley (2000)', items: [{ promptId: 'prm_ce', promptRevision: 2, attemptIds: ['att_88'] }, { promptId: 'prm_loop', promptRevision: 1, attemptIds: ['att_89'] }, { promptId: 'prm_buffer', promptRevision: 1, attemptIds: [] }], conversationId: 'thr_2' },
  { id: 'ses_1', title: 'Restaurant Japanese', kind: 'communication', status: 'ended', startedAt: minutesAgo(9000), endedAt: minutesAgo(8940), originRef: { owner: 'japanese', kind: 'practice_origin', id: 'po_1' }, sourceTitle: 'Irodori A2', items: [{ promptId: 'prm_menu', promptRevision: 1, attemptIds: [] }] },
]

let checkpoints: Checkpoint[] = [
  { id: 'chk_3', sessionId: 'ses_2', topic: 'Working memory', understood: 'The executive allocates attention and stores nothing; the loop has two parts.', openQuestion: 'Is the episodic buffer better described as a store or a process?', nextStep: 'Re-read p. 421 §2–§4 and answer prm_buffer without the reference.', sourceRefs: [{ sourceTitle: 'Baddeley (2000)', locator: 'p. 421 §2', route: '/learn/library/src_baddeley', available: true }], status: 'open', revision: 2, updatedAt: minutesAgo(1300), generatedBy: 'ai' },
  { id: 'chk_4', sessionId: 'ses_1', topic: 'Ordering food', understood: 'すみません + 〜をお願いします covers most orders.', openQuestion: 'How to ask for the bill politely at an izakaya?', nextStep: 'Find a dialogue with お会計 and try prm_menu again independently.', sourceRefs: [{ sourceTitle: 'Irodori A2', locator: 'Unit 3 · dialogue 2', route: '/learn/library/src_irodori', available: true }], status: 'paused', revision: 1, updatedAt: minutesAgo(8940), generatedBy: 'user' },
  { id: 'chk_5', sessionId: 'ses_0', topic: 'Pinhole projection', understood: 'Each leaf gap projects a dim sun image.', openQuestion: 'Why are projected discs larger than the gaps?', nextStep: 'Sketch the geometry with distance labels.', sourceRefs: [{ sourceTitle: '(source removed)', locator: 'p. 12', route: '#', available: false }], status: 'paused', revision: 1, updatedAt: minutesAgo(40000), generatedBy: 'user' },
]

const attemptKeys = new Set<string>()

export async function listSessions(): Promise<Snapshot<StudySession[]>> {
  await wait()
  return snapshot([...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)))
}

export async function listPrompts(): Promise<Snapshot<Prompt[]>> {
  await wait(160)
  return snapshot(prompts)
}

export async function getSession(id: string): Promise<Snapshot<{ session: StudySession; prompts: Prompt[]; attempts: Attempt[] }> | null> {
  await wait(220)
  const session = sessions.find((item) => item.id === id)
  if (!session) return null
  const sessionPrompts = session.items.map((item) => prompts.find((prompt) => prompt.id === item.promptId)).filter((prompt): prompt is Prompt => Boolean(prompt))
  return snapshot({ session, prompts: sessionPrompts, attempts: attempts.filter((attempt) => session.items.some((item) => item.attemptIds.includes(attempt.id))) })
}

export async function startSession(promptIds: string[], kind: ActivityKind, title: string): Promise<Operation<StudySession>> {
  await wait(300)
  const approved = prompts.filter((prompt) => promptIds.includes(prompt.id) && prompt.status === 'approved')
  if (approved.length === 0) return failedOperation('validation', false, 'Select at least one approved prompt.')
  const session: StudySession = { id: newId('ses'), title, kind, status: 'active', startedAt: nowIso(), items: approved.map((prompt) => ({ promptId: prompt.id, promptRevision: prompt.revision, attemptIds: [] })), conversationId: newId('thr') }
  sessions = [session, ...sessions]
  return completed(session)
}

export async function recordAttempt(sessionId: string, promptId: string, answer: string, assistance: Assistance, idempotencyKey: string): Promise<Operation<Attempt>> {
  await wait(240)
  if (attemptKeys.has(idempotencyKey)) return completed(attempts.find((attempt) => attempt.id === idempotencyKey) as Attempt)
  const session = sessions.find((item) => item.id === sessionId)
  const item = session?.items.find((entry) => entry.promptId === promptId)
  if (!session || !item) return failedOperation('not_found', false)
  attemptKeys.add(idempotencyKey)
  const attempt: Attempt = { id: idempotencyKey, promptId, promptRevision: item.promptRevision, answer, assistance, submittedAt: nowIso(), assessments: [] }
  attempts = [...attempts, attempt]
  item.attemptIds.push(attempt.id)
  return completed(attempt)
}

export async function recordSelfAssessment(attemptId: string, score: number): Promise<Operation<Attempt>> {
  await wait(160)
  const attempt = attempts.find((item) => item.id === attemptId)
  if (!attempt) return failedOperation('not_found', false)
  const assessment: Assessment = { id: newId('as'), provenance: 'self', score, maxScore: 5, at: nowIso() }
  attempt.assessments = [...attempt.assessments, assessment]
  return completed({ ...attempt })
}

export async function requestAiFeedback(attemptId: string): Promise<Operation<Attempt>> {
  const attempt = attempts.find((item) => item.id === attemptId)
  if (!attempt) return failedOperation('not_found', false)
  const pending: Assessment = { id: newId('as'), provenance: 'ai_draft', maxScore: 5, at: nowIso(), state: 'pending' }
  attempt.assessments = [...attempt.assessments, pending]
  await wait(1500)
  const prompt = prompts.find((item) => item.id === attempt.promptId)
  // Simulate one provider failure for very short answers to exercise the recovery path.
  if (attempt.answer.trim().length < 12) {
    pending.state = 'failed'
    pending.error = 'Provider timeout. Your answer is saved; request feedback again or assess it yourself.'
    return completed({ ...attempt })
  }
  pending.state = 'completed'
  pending.score = Math.min(5, Math.max(1, Math.round(attempt.answer.length / 40)))
  pending.feedback = `Compared with the reference at ${prompt?.sourceRefs.map((ref) => ref.locator).join(', ')}: the main mechanism is present. Check whether you separated what the component does from what it stores.`
  pending.citedLocators = prompt?.sourceRefs.map((ref) => ref.locator)
  return completed({ ...attempt })
}

export async function approvePrompt(promptId: string): Promise<Operation<Prompt>> {
  await wait(200)
  const prompt = prompts.find((item) => item.id === promptId)
  if (!prompt) return failedOperation('not_found', false)
  const next: Prompt = { ...prompt, status: 'approved', revision: prompt.revision + 1 }
  prompts = prompts.map((item) => (item.id === promptId ? next : item))
  return completed(next)
}

export async function createPromptDraft(sourceTitle: string, kind: ActivityKind): Promise<Operation<Prompt>> {
  await wait(1300)
  const prompt: Prompt = { id: newId('prm'), revision: 1, status: 'draft', kind, question: `(${kind}) Draft from ${sourceTitle}: explain the key mechanism described at the cited location.`, referenceAnswer: 'Reference drafted from the cited passage; review before approving.', sourceRefs: [{ sourceId: 'src_baddeley', sourceTitle, locator: 'p. 423 §1', revision: 2 }], generatedBy: 'ai' }
  prompts = [prompt, ...prompts]
  return completed(prompt)
}

export async function pauseSession(id: string): Promise<Operation<StudySession>> {
  await wait(160)
  const session = sessions.find((item) => item.id === id)
  if (!session) return failedOperation('not_found', false)
  session.status = 'paused'
  return completed({ ...session })
}

export async function endSession(id: string): Promise<Operation<StudySession>> {
  await wait(200)
  const session = sessions.find((item) => item.id === id)
  if (!session) return failedOperation('not_found', false)
  session.status = 'ended'
  session.endedAt = nowIso()
  return completed({ ...session })
}

export async function listResumeCandidates(): Promise<Snapshot<Checkpoint[]>> {
  await wait()
  return snapshot(checkpoints.filter((item) => item.status !== 'resolved').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
}

export async function saveCheckpoint(sessionId: string, draft: Omit<Checkpoint, 'id' | 'sessionId' | 'status' | 'revision' | 'updatedAt'>): Promise<Operation<Checkpoint>> {
  await wait(260)
  const existing = checkpoints.find((item) => item.sessionId === sessionId && item.status === 'open')
  if (existing) {
    const next: Checkpoint = { ...existing, ...draft, revision: existing.revision + 1, updatedAt: nowIso() }
    checkpoints = checkpoints.map((item) => (item.id === existing.id ? next : item))
    return completed(next)
  }
  const checkpoint: Checkpoint = { id: newId('chk'), sessionId, ...draft, status: 'open', revision: 1, updatedAt: nowIso() }
  checkpoints = [checkpoint, ...checkpoints]
  return completed(checkpoint)
}

export async function draftCheckpointWithAi(sessionId: string): Promise<Omit<Checkpoint, 'id' | 'sessionId' | 'status' | 'revision' | 'updatedAt'>> {
  await wait(1200)
  const session = sessions.find((item) => item.id === sessionId)
  return {
    topic: session?.title ?? 'Session',
    understood: 'The executive is an attentional controller with no storage; the loop has a store plus rehearsal.',
    openQuestion: 'Is the episodic buffer a store or a process?',
    nextStep: 'Answer prm_buffer without the reference, then compare with p. 421 §2.',
    sourceRefs: [{ sourceTitle: 'Baddeley (2000)', locator: 'p. 421 §2', route: '/learn/library/src_baddeley', available: true }],
    generatedBy: 'ai',
  }
}

export async function resolveCheckpoint(id: string, status: Checkpoint['status']): Promise<Operation<Checkpoint>> {
  await wait(160)
  const checkpoint = checkpoints.find((item) => item.id === id)
  if (!checkpoint) return failedOperation('not_found', false)
  const next = { ...checkpoint, status, revision: checkpoint.revision + 1, updatedAt: nowIso() }
  checkpoints = checkpoints.map((item) => (item.id === id ? next : item))
  return completed(next)
}

export async function resumeFromCheckpoint(id: string): Promise<Operation<StudySession>> {
  await wait(300)
  const checkpoint = checkpoints.find((item) => item.id === id)
  if (!checkpoint) return failedOperation('not_found', false)
  const original = sessions.find((item) => item.id === checkpoint.sessionId)
  const session: StudySession = { id: newId('ses'), title: `${checkpoint.topic} · resumed`, kind: original?.kind ?? 'recall', status: 'active', startedAt: nowIso(), sourceTitle: original?.sourceTitle, items: original ? original.items.map((item) => ({ ...item, attemptIds: [] })) : [], conversationId: original?.conversationId }
  sessions = [session, ...sessions]
  return completed(session)
}
