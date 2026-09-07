import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ConnectionCandidate, SuggestionRun } from './types'

/* Connections HTTP adapter (mock): /api/v1/connections/... Knowledge owns the accepted relation. */

let runs: SuggestionRun[] = [{ id: 'run_1', at: minutesAgo(700), candidates: 3, model: 'claude-fable-5-1', status: 'completed' }]

let candidates: ConnectionCandidate[] = [
  { id: 'cc_1', runId: 'run_1', from: { noteId: 'note_wm', title: 'Working memory is a control system, not a box', revision: 5, excerpt: 'The executive allocates attention between the phonological loop and the visuospatial sketchpad.' }, to: { noteId: 'note_stale', title: 'Stale vs unknown is not the same as false', revision: 3, excerpt: 'A missing observation is not evidence of a negative state.' }, relation: 'related', explanation: 'Both notes separate “the controller has nothing” from “we cannot see what it has”. In WM the executive has no store; in home state a stale sensor has an unobserved store.', kind: 'analogy', limitations: ['This is a structural analogy, not a factual equivalence.', 'The home note has no source; the WM note cites Baddeley p. 418.'], evidence: [{ noteId: 'note_wm', locator: '¶1', passage: 'an executive that stores nothing' }, { noteId: 'note_stale', locator: '¶1', passage: 'A sensor that stopped reporting is "unknown", not "safe"' }], status: 'pending', createdAt: minutesAgo(700) },
  { id: 'cc_2', runId: 'run_1', from: { noteId: 'note_komorebi', title: 'Why leaf gaps make crescents', revision: 1, excerpt: 'Each gap is a pinhole; each pinhole projects the sun.' }, to: { noteId: 'note_attention', title: 'Attention as selection under capacity limits', revision: 2, excerpt: 'high load = early filtering' }, relation: 'example', explanation: 'A pinhole selects a narrow bundle of rays; early selection filters input before full processing. Both are aperture metaphors.', kind: 'analogy', limitations: ['Weak: the optics note is a draft and the analogy may mislead about mechanism.'], evidence: [{ noteId: 'note_komorebi', locator: '¶1', passage: 'a small aperture lets only a narrow bundle of rays' }], status: 'pending', createdAt: minutesAgo(700) },
  { id: 'cc_3', runId: 'run_1', from: { noteId: 'note_menu', title: 'Ordering at a restaurant (Japanese)', revision: 1, excerpt: '〜をお願いします to order.' }, to: { noteId: 'note_wm', title: 'Working memory is a control system, not a box', revision: 4, excerpt: '' }, relation: 'related', explanation: 'Rehearsing set phrases uses the phonological loop.', kind: 'equivalence', limitations: ['Source note revised since suggestion (r4 → r5).'], evidence: [], status: 'stale', createdAt: minutesAgo(700) },
]

export async function listCandidates(): Promise<Snapshot<{ candidates: ConnectionCandidate[]; runs: SuggestionRun[] }>> {
  await wait()
  return snapshot({ candidates, runs })
}

export async function requestSuggestions(): Promise<Operation<SuggestionRun>> {
  await wait(1600)
  const run: SuggestionRun = { id: newId('run'), at: nowIso(), candidates: 1, model: 'claude-fable-5-1', status: 'completed' }
  runs = [run, ...runs]
  candidates = [
    { id: newId('cc'), runId: run.id, from: { noteId: 'note_stale', title: 'Stale vs unknown is not the same as false', revision: 3, excerpt: 'no evidence for a preference is not evidence against it' }, to: { noteId: 'note_wm', title: 'Working memory is a control system, not a box', revision: 5, excerpt: 'if the executive had storage, you could not explain dual-task costs' }, relation: 'contrast', explanation: 'One note argues from absence of observation; the other argues from a counterfactual. Different inference styles for “nothing there”.', kind: 'analogy', limitations: ['Only two notes were in scope; no learning history was used.'], evidence: [{ noteId: 'note_stale', locator: '¶2', passage: 'no evidence for a preference is not evidence against it' }], status: 'pending', createdAt: nowIso() },
    ...candidates,
  ]
  return completed(run)
}

export async function decideCandidate(id: string, decision: 'accepted' | 'dismissed', editedRelation?: ConnectionCandidate['relation']): Promise<Operation<ConnectionCandidate>> {
  await wait(300)
  const candidate = candidates.find((item) => item.id === id)
  if (!candidate) return failedOperation('not_found', false)
  if (candidate.status === 'stale') return failedOperation('stale', false, 'A source note changed; request a fresh suggestion.')
  if (decision === 'dismissed') {
    candidate.status = 'dismissed'
    return completed({ ...candidate })
  }
  candidate.status = 'promoting'
  await wait(600)
  // Idempotent promotion through Knowledge.addRelation; a retry cannot add the relation twice.
  candidate.status = 'accepted'
  if (editedRelation) candidate.relation = editedRelation
  return completed({ ...candidate })
}
