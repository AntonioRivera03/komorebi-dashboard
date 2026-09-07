import { completed, failedOperation, hoursFromNow, minutesAgo, newId, nowIso, wait } from '../../../shared/api/mock'
import type { Operation } from '../../../shared/contracts/common'
import type { ActionProposal, ChatMessage, RegisteredTool, ThreadSummary } from './types'

/*
 * Assistant HTTP adapter (mock): /api/v1/assistant/...
 * Messages are persisted through the Conversations contract on the server;
 * this module only ever speaks to the Assistant endpoints.
 */

export const registeredTools: RegisteredTool[] = [
  { name: 'knowledge.search', owner: 'knowledge', classification: 'read', confirmation: 'none', scope: 'knowledge:read', description: 'Lexical + semantic search over authorized notes and sources' },
  { name: 'study.getAttempts', owner: 'study', classification: 'read', confirmation: 'none', scope: 'study:read', description: 'Attempts and assessments for a prompt or session' },
  { name: 'goals.getGoalSummary', owner: 'goals', classification: 'read', confirmation: 'none', scope: 'goals:read', description: 'Goal status, milestones and linked actions' },
  { name: 'calendar.listAgenda', owner: 'calendar', classification: 'read', confirmation: 'none', scope: 'calendar:read', description: 'Bounded agenda for a time range' },
  { name: 'calendar.proposeBlock', owner: 'calendar', classification: 'write', confirmation: 'preview', scope: 'calendar:write', description: 'Draft an internal task block; confirmation required' },
  { name: 'tasks.createTask', owner: 'tasks', classification: 'write', confirmation: 'preview', scope: 'tasks:write', description: 'Create a task from an accepted draft' },
  { name: 'home.applyScene', owner: 'home', classification: 'write', confirmation: 'none', scope: 'home:scenes', description: 'Apply a permitted named scene (low impact)' },
  { name: 'capture.captureItem', owner: 'capture', classification: 'write', confirmation: 'none', scope: 'capture:write', description: 'Save text to the inbox' },
]

let threads: ThreadSummary[] = [
  { id: 'thr_1', title: 'Working memory confusion', originCapability: 'assistant', updatedAt: minutesAgo(40), messageCount: 6 },
  { id: 'thr_2', title: 'Chapter 4 study session', originCapability: 'study', updatedAt: minutesAgo(1300), messageCount: 14 },
  { id: 'thr_3', title: 'Plan the week around the exam', originCapability: 'assistant', updatedAt: minutesAgo(4000), messageCount: 9 },
]

const messagesByThread: Record<string, ChatMessage[]> = {
  thr_1: [
    { id: 'msg_1', role: 'user', text: 'What did I say I found confusing about working memory last week?', at: minutesAgo(45) },
    {
      id: 'msg_2',
      role: 'assistant',
      text: 'In your Tuesday checkpoint you wrote that the distinction between the phonological loop and the episodic buffer felt arbitrary, and your recall attempt on “central executive” scored 2/5 with a hint. The open question you left was whether the buffer is a store or a process.',
      at: minutesAgo(44),
      runState: 'completed',
      toolCalls: [
        { tool: 'study.getAttempts', classification: 'read', summary: '3 attempts for prompt prm_ce' },
        { tool: 'knowledge.search', classification: 'read', summary: '“working memory” · 4 results' },
      ],
      evidence: [
        { id: 'ev_1', resource: { owner: 'study', kind: 'checkpoint', id: 'chk_3', revision: 2 }, label: 'Checkpoint · Working memory', excerpt: 'Loop vs buffer feels arbitrary — is the buffer a store or a process?', route: '/learn/resume' },
        { id: 'ev_2', resource: { owner: 'study', kind: 'attempt', id: 'att_88' }, label: 'Attempt · central executive', excerpt: 'Self-assessed 2/5 · hint used', route: '/learn/practice/ses_2' },
        { id: 'ev_3', resource: { owner: 'knowledge', kind: 'source_chunk', id: 'chk_bad_2001', revision: 1 }, label: 'Baddeley (2000) · p. 421', excerpt: 'The episodic buffer is assumed to be a limited-capacity temporary storage system…', route: '/learn/library/src_baddeley', locator: 'p. 421 §2' },
      ],
    },
    { id: 'msg_3', role: 'user', text: 'Can you schedule 40 minutes tomorrow evening to go back over that?', at: minutesAgo(41) },
    {
      id: 'msg_4',
      role: 'assistant',
      text: 'Here is a proposed internal block. It does not touch your provider calendar; confirm to save it.',
      at: minutesAgo(40),
      runState: 'completed',
      toolCalls: [{ tool: 'calendar.listAgenda', classification: 'read', summary: 'tomorrow 17:00–22:00 · 1 event' }],
      proposal: {
        id: 'prop_1',
        version: 1,
        tool: 'calendar.proposeBlock',
        toolVersion: '1.0',
        classification: 'write',
        preview: 'Internal block “Working memory: loop vs buffer” · tomorrow 19:30–20:10 · linked to task tsk_9 · no conflicts with provider events',
        args: { taskRef: 'tasks/task/tsk_9', start: 'tomorrow 19:30', durationMinutes: '40', timeZone: 'Europe/Madrid' },
        requiredScopes: ['calendar:write', 'tasks:read'],
        sourceRevisions: [{ owner: 'tasks', kind: 'task', id: 'tsk_9', revision: 1 }, { owner: 'calendar', kind: 'agenda', id: 'tomorrow', revision: 12 }],
        status: 'ready_for_review',
        expiresAt: hoursFromNow(2),
      },
    },
  ],
  thr_2: [
    { id: 'msg_s1', role: 'system', text: 'Study session ses_2 started with 6 approved prompts from “Chapter 4 lecture notes” r2.', at: minutesAgo(1400), originCapability: 'study' },
    { id: 'msg_s2', role: 'user', text: 'I think the central executive allocates attention between the slave systems but I am not sure what it does on its own.', at: minutesAgo(1390), originCapability: 'study' },
    { id: 'msg_s3', role: 'assistant', text: 'That matches the source: Baddeley describes it as an attentional controller with no storage of its own (p. 418). A useful check: what would break if it had storage?', at: minutesAgo(1389), runState: 'completed', evidence: [{ id: 'ev_s1', resource: { owner: 'knowledge', kind: 'source_chunk', id: 'chk_bad_1998', revision: 1 }, label: 'Baddeley (2000) · p. 418', excerpt: 'The central executive is assumed to be an attentional control system…', route: '/learn/library/src_baddeley', locator: 'p. 418 §1' }] },
    { id: 'msg_s4', role: 'assistant', text: '', at: minutesAgo(1300), runState: 'interrupted', limitation: 'The provider connection dropped mid-answer. Your answer above was saved before the request.' },
  ],
  thr_3: [
    { id: 'msg_p1', role: 'user', text: 'Help me plan the week around the cognition exam.', at: minutesAgo(4000) },
    { id: 'msg_p2', role: 'assistant', text: 'Your blueprint weights memory 35%, attention 25%, perception 20%, methods 20%. Coverage is lowest in methods (1 of 4 topics has any prompt). I would not claim a score; I can propose two preparation blocks.', at: minutesAgo(3998), runState: 'completed', evidence: [{ id: 'ev_p1', resource: { owner: 'exams', kind: 'blueprint_revision', id: 'bp_2', revision: 2 }, label: 'Blueprint r2', excerpt: 'memory 35 · attention 25 · perception 20 · methods 20', route: '/learn/exams/exam_cog' }] },
  ],
}

const proposals = new Map<string, ActionProposal>()
proposals.set('prop_1', messagesByThread.thr_1[3].proposal as ActionProposal)
const sentClientIds = new Set<string>()

export async function listThreads(): Promise<ThreadSummary[]> {
  await wait(160)
  return [...threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  await wait(200)
  return messagesByThread[threadId] ?? []
}

export async function createThread(title: string): Promise<ThreadSummary> {
  await wait(120)
  const thread: ThreadSummary = { id: newId('thr'), title, originCapability: 'assistant', updatedAt: nowIso(), messageCount: 0 }
  threads = [thread, ...threads]
  messagesByThread[thread.id] = []
  return thread
}

function draftReply(text: string): ChatMessage {
  const lower = text.toLowerCase()
  const base: ChatMessage = { id: newId('msg'), role: 'assistant', text: '', at: nowIso(), runState: 'completed' }
  if (/(schedule|block|calendar|time)/.test(lower)) {
    const proposal: ActionProposal = {
      id: newId('prop'),
      version: 1,
      tool: 'calendar.proposeBlock',
      toolVersion: '1.0',
      classification: 'write',
      preview: 'Internal block “Focused work” · tomorrow 09:30–10:15 · no conflicts with provider events · not written to the provider',
      args: { start: 'tomorrow 09:30', durationMinutes: '45', timeZone: 'Europe/Madrid' },
      requiredScopes: ['calendar:write'],
      sourceRevisions: [{ owner: 'calendar', kind: 'agenda', id: 'tomorrow', revision: 12 }],
      status: 'ready_for_review',
      expiresAt: hoursFromNow(1),
    }
    proposals.set(proposal.id, proposal)
    return { ...base, text: 'I drafted a block that fits the free time I can see. Review the exact change before confirming.', toolCalls: [{ tool: 'calendar.listAgenda', classification: 'read', summary: 'tomorrow · 2 events' }], proposal }
  }
  if (/(scene|light|lamp|evening|night)/.test(lower)) {
    const proposal: ActionProposal = {
      id: newId('prop'),
      version: 1,
      tool: 'home.applyScene',
      toolVersion: '1.0',
      classification: 'write',
      preview: 'Apply scene “Evening” in Living room · 3 targets (floor lamp 40%, shelf light warm, ceiling off)',
      args: { sceneId: 'scn_evening', revision: '3' },
      requiredScopes: ['home:scenes'],
      sourceRevisions: [{ owner: 'home', kind: 'scene', id: 'scn_evening', revision: 3 }],
      status: 'ready_for_review',
      expiresAt: hoursFromNow(1),
    }
    proposals.set(proposal.id, proposal)
    return { ...base, text: 'Scene changes are low impact, but I will still show you the targets first.', proposal }
  }
  if (/(remember|note|capture)/.test(lower)) {
    return { ...base, text: 'Saved to your inbox. It will keep its origin as “assistant” so you can see where it came from.', toolCalls: [{ tool: 'capture.captureItem', classification: 'write', summary: 'captured 1 item' }] }
  }
  if (/(confus|last week|remember what|what did i)/.test(lower)) {
    return { ...base, text: 'Your most recent checkpoint mentions the loop-versus-buffer distinction as unclear, and the central executive prompt has the weakest attempts.', toolCalls: [{ tool: 'study.getAttempts', classification: 'read', summary: '3 attempts' }], evidence: [{ id: newId('ev'), resource: { owner: 'study', kind: 'checkpoint', id: 'chk_3', revision: 2 }, label: 'Checkpoint · Working memory', excerpt: 'Loop vs buffer feels arbitrary — is the buffer a store or a process?', route: '/learn/resume' }] }
  }
  return { ...base, text: 'I could not find evidence for that in your authorized notes, attempts or commitments, so I will not guess.', limitation: 'No evidence found in registered read tools (knowledge.search, study.getAttempts, goals.getGoalSummary).', toolCalls: [{ tool: 'knowledge.search', classification: 'read', summary: '0 results' }] }
}

export async function sendMessage(threadId: string, text: string, clientMessageId: string): Promise<Operation<ChatMessage[]>> {
  await wait(120)
  if (!messagesByThread[threadId]) messagesByThread[threadId] = []
  if (!sentClientIds.has(clientMessageId)) {
    sentClientIds.add(clientMessageId)
    messagesByThread[threadId].push({ id: newId('msg'), clientMessageId, role: 'user', text, at: nowIso() })
  }
  await wait(900)
  const reply = draftReply(text)
  messagesByThread[threadId].push(reply)
  threads = threads.map((thread) => (thread.id === threadId ? { ...thread, updatedAt: nowIso(), messageCount: messagesByThread[threadId].length, title: thread.messageCount === 0 ? text.slice(0, 48) : thread.title } : thread))
  return completed(messagesByThread[threadId])
}

export async function confirmProposal(proposalId: string, version: number): Promise<Operation<ActionProposal>> {
  await wait(300)
  const proposal = proposals.get(proposalId)
  if (!proposal) return failedOperation('not_found', false)
  if (proposal.version !== version) return failedOperation('superseded', false, 'The proposal changed since you saw it. Review the new preview.')
  if (new Date(proposal.expiresAt).getTime() < Date.now()) {
    proposal.status = 'expired'
    return failedOperation('expired', false, 'This proposal expired. Ask for a fresh preview.')
  }
  if (proposal.status === 'completed') return completed(proposal)
  proposal.status = 'executing'
  await wait(900)
  proposal.status = 'completed'
  proposal.resultRoute = proposal.tool.startsWith('calendar') ? '/calendar' : '/home/scenes'
  proposal.resultLabel = proposal.tool.startsWith('calendar') ? 'Block saved · provider write not requested' : 'Scene run completed · 3/3 confirmed'
  return completed({ ...proposal })
}

export async function refreshProposal(proposalId: string): Promise<Operation<ActionProposal>> {
  await wait(500)
  const proposal = proposals.get(proposalId)
  if (!proposal) return failedOperation('not_found', false)
  const next: ActionProposal = { ...proposal, version: proposal.version + 1, status: 'ready_for_review', expiresAt: hoursFromNow(1) }
  proposals.set(proposalId, next)
  return completed(next)
}
