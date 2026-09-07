import { completed, failedOperation, minutesAgo, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { Thread, ThreadMessage } from './types'

/* Conversations HTTP adapter (mock): /api/v1/conversations/... Canonical messages for every feature chat. */

let threads: Thread[] = [
  { id: 'thr_1', title: 'Working memory confusion', originCapability: 'assistant', createdAt: minutesAgo(50), updatedAt: minutesAgo(40), messageCount: 4, archived: false, contextRefs: ['study/checkpoint/chk_3@2', 'knowledge/source_chunk/chk_bad_2001@1', 'memory/item/mem_2@3'], summary: { text: 'User asked what confused them about working memory; assistant cited the loop-vs-buffer checkpoint and proposed a 40-minute evening block.', version: 2 } },
  { id: 'thr_2', title: 'Chapter 4 study session', originCapability: 'study', createdAt: minutesAgo(1400), updatedAt: minutesAgo(1300), messageCount: 4, archived: false, contextRefs: ['study/session/ses_2', 'knowledge/source/src_baddeley@2'] },
  { id: 'thr_3', title: 'Plan the week around the exam', originCapability: 'assistant', createdAt: minutesAgo(4100), updatedAt: minutesAgo(4000), messageCount: 2, archived: false, contextRefs: ['exams/blueprint_revision/bp_2@2'] },
  { id: 'thr_4', title: 'Izakaya role-play', originCapability: 'japanese', createdAt: minutesAgo(9000), updatedAt: minutesAgo(8940), messageCount: 12, archived: true, contextRefs: ['knowledge/source/src_irodori@1'] },
]

const messages: Record<string, ThreadMessage[]> = {
  thr_1: [
    { id: 'm1', role: 'user', text: 'What did I say I found confusing about working memory last week?', at: minutesAgo(45), status: 'completed', revisions: [] },
    { id: 'm2', role: 'assistant', text: 'In your Tuesday checkpoint you wrote that the distinction between the phonological loop and the episodic buffer felt arbitrary…', at: minutesAgo(44), status: 'completed', revisions: [], run: { id: 'ir_1', model: 'claude-fable-5-1', promptTemplate: 'assistant.answer@v4', latencyMs: 2100, tokensIn: 3900, tokensOut: 210, tools: ['study.getAttempts', 'knowledge.search'], contextRefs: ['study/checkpoint/chk_3@2', 'memory/item/mem_2@3'] } },
    { id: 'm3', role: 'user', text: 'Can you schedule 40 minutes tomorrow evening to go back over that?', at: minutesAgo(41), status: 'completed', revisions: [{ revision: 1, text: 'Can you schedule 30 minutes tomorrow to go back over that?', at: minutesAgo(42) }] },
    { id: 'm4', role: 'assistant', text: 'Here is a proposed internal block…', at: minutesAgo(40), status: 'completed', revisions: [], run: { id: 'ir_2', model: 'claude-fable-5-1', promptTemplate: 'assistant.propose@v2', latencyMs: 1800, tokensIn: 2400, tokensOut: 160, tools: ['calendar.listAgenda', 'calendar.proposeBlock'], contextRefs: ['tasks/task/tsk_9@1', 'calendar/agenda/tomorrow@12'] } },
  ],
  thr_2: [
    { id: 's1', role: 'system', text: 'Study session ses_2 started with 6 approved prompts.', at: minutesAgo(1400), status: 'completed', revisions: [] },
    { id: 's2', role: 'user', text: 'I think the central executive allocates attention between the slave systems but I am not sure what it does on its own.', at: minutesAgo(1390), status: 'completed', revisions: [] },
    { id: 's3', role: 'assistant', text: 'That matches the source: Baddeley describes it as an attentional controller with no storage of its own (p. 418).', at: minutesAgo(1389), status: 'completed', revisions: [], run: { id: 'ir_3', model: 'claude-fable-5-1', promptTemplate: 'study.tutor@v3', latencyMs: 1500, tokensIn: 2100, tokensOut: 90, tools: [], contextRefs: ['knowledge/source_chunk/chk_bad_1998@2'] } },
    { id: 's4', role: 'assistant', text: '', at: minutesAgo(1300), status: 'interrupted', revisions: [], run: { id: 'ir_4', model: 'claude-fable-5-1', promptTemplate: 'study.feedback@v2', latencyMs: 20000, tokensIn: 2600, tokensOut: 0, tools: [], contextRefs: ['study/attempt/att_88'] } },
  ],
  thr_3: [
    { id: 'p1', role: 'user', text: 'Help me plan the week around the cognition exam.', at: minutesAgo(4100), status: 'completed', revisions: [] },
    { id: 'p2', role: 'assistant', text: 'Your blueprint weights memory 35%… I would not claim a score; I can propose two preparation blocks.', at: minutesAgo(4000), status: 'completed', revisions: [], run: { id: 'ir_5', model: 'claude-fable-5-1', promptTemplate: 'assistant.answer@v4', latencyMs: 2600, tokensIn: 4100, tokensOut: 240, tools: ['exams.getCoverage'], contextRefs: ['exams/blueprint_revision/bp_2@2'] } },
  ],
  thr_4: [{ id: 'j1', role: 'system', text: 'Archived thread. Messages retained until explicit deletion.', at: minutesAgo(9000), status: 'completed', revisions: [] }],
}

export async function listThreads(query: string, includeArchived: boolean): Promise<Snapshot<Thread[]>> {
  await wait()
  const needle = query.trim().toLowerCase()
  return snapshot(threads.filter((thread) => (includeArchived || !thread.archived) && (!needle || thread.title.toLowerCase().includes(needle) || thread.summary?.text.toLowerCase().includes(needle))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
}

export async function getThread(id: string): Promise<Snapshot<{ thread: Thread; messages: ThreadMessage[] }> | null> {
  await wait(220)
  const thread = threads.find((item) => item.id === id)
  if (!thread) return null
  return snapshot({ thread, messages: messages[id] ?? [] })
}

export async function reviseMessage(threadId: string, messageId: string, text: string): Promise<Operation<ThreadMessage>> {
  await wait(220)
  const message = messages[threadId]?.find((item) => item.id === messageId)
  if (!message) return failedOperation('not_found', false)
  message.revisions = [...message.revisions, { revision: message.revisions.length + 1, text: message.text, at: nowIso() }]
  message.text = text
  return completed({ ...message })
}

export async function archiveThread(id: string, archived: boolean): Promise<Operation<Thread>> {
  await wait(160)
  const thread = threads.find((item) => item.id === id)
  if (!thread) return failedOperation('not_found', false)
  thread.archived = archived
  return completed({ ...thread })
}

export async function deleteThread(id: string): Promise<Operation<void>> {
  await wait(300)
  threads = threads.filter((item) => item.id !== id)
  delete messages[id]
  return completed(undefined)
}
