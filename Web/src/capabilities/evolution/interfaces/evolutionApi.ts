import { completed, failedOperation, minutesAgo, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ImprovementCandidate } from './types'

/* Evolution HTTP adapter (mock): /api/v1/evolution/... Evidence and evaluation exist; autonomous execution authority is pending. */

let candidates: ImprovementCandidate[] = [
  { id: 'imp_1', title: 'Offer “convert to task” directly from a voice capture', problem: '6 of 9 voice captures this month were converted to tasks within a minute, each needing 3 taps.', hypothesis: 'A one-tap conversion for voice captures whose suggestion is high-confidence reduces friction without hiding the preview.', changeType: 'ui', affected: ['capture', 'voice'], expectedBenefit: 'Median capture→task time 48 s → under 15 s for voice-origin captures', measurement: 'usage.workflow(capture → task, origin=voice) median duration over 30 days; acceptance/edit ratio unchanged', rollback: 'Feature flag; no data change', status: 'evaluating', authority: 'requires_approval', evidence: [{ ref: 'usage/workflow/capture_task', kind: 'usage', excerpt: '41 started · 33 completed · 6 abandoned · median 48 s', route: '/history/usage' }, { ref: 'usage/suggestion/capture_destination', kind: 'usage', excerpt: '22 accepted · 6 edited · 4 dismissed of 38', route: '/history/usage' }], evaluation: { criteria: [{ name: 'Does not bypass the preview', baseline: 'preview always shown', result: 'preview shown on tap', met: true }, { name: 'No duplicate conversions', baseline: '0 duplicates', result: '0 in simulation', met: true }, { name: 'Usefulness (corrections)', baseline: '6/38 edits', result: 'pending', met: undefined }], note: 'Simulation only; no behaviour changed yet.', at: minutesAgo(1200) }, createdAt: minutesAgo(3000) },
  { id: 'imp_2', title: 'Rank late-night learning cards lower on Today', problem: 'Learning cards presented after 22:00 are dismissed 7 of 9 times.', hypothesis: 'Deprioritising learning contributions after 22:00 (not hiding them) increases opened-rate without changing the card limit.', changeType: 'assistance', affected: ['today'], expectedBenefit: 'Fewer dismissals late at night; no drop in daytime opens', measurement: 'usage.suggestion(today card, kind=learning) dismissal rate by hour over 4 weeks', status: 'applied', authority: 'assistance_auto', evidence: [{ ref: 'memory/item/mem_2', kind: 'usage', excerpt: 'Often dismisses long sessions suggested late at night (7/9)', route: '/memory' }], evaluation: { criteria: [{ name: 'Card limit unchanged', baseline: '6', result: '6', met: true }, { name: 'Hard visibility rules unchanged', baseline: 'server-enforced', result: 'unchanged', met: true }], note: 'Personal-assistance ranking change; within current authority.', at: minutesAgo(9000) }, decision: { by: 'you', at: minutesAgo(8900), note: 'Fine, but keep them visible if I pin one.' }, outcome: { baseline: '78% dismissed after 22:00', observed: '31% dismissed after 22:00 · daytime opens unchanged', window: '2 weeks', conclusion: 'Supported; continue measuring.' }, createdAt: minutesAgo(12000) },
  { id: 'imp_3', title: 'Auto-approve AI prompt drafts that cite two or more locators', problem: 'You approve 92% of AI prompt drafts unchanged.', hypothesis: 'Auto-approval would save review time.', changeType: 'behavior', affected: ['study'], expectedBenefit: 'Fewer approval taps', measurement: 'Approval time; rate of later flagged prompts', status: 'rejected', authority: 'requires_approval', evidence: [{ ref: 'usage/action/study.prompt.approve', kind: 'usage', excerpt: '46 of 50 drafts approved unchanged', route: '/history/usage' }], decision: { by: 'you', at: minutesAgo(20000), note: 'No. Approval is the point; the 4 I changed were the ones that mattered.' }, createdAt: minutesAgo(25000) },
  { id: 'imp_4', title: 'Generate a Home Alerts rule from repeated manual checks', problem: 'You opened the balcony sensor 11 times in 3 days while it was unavailable.', hypothesis: 'A “device unavailable” rule already exists; this is friction in alert visibility, not a missing rule.', changeType: 'ui', affected: ['home-alerts', 'today'], expectedBenefit: 'Fewer manual checks', measurement: 'home.device.open count while an alert is active', status: 'proposed', authority: 'pending_brief', evidence: [{ ref: 'usage/action/home.device.open', kind: 'usage', excerpt: '11 opens of dev_soil in 72 h; alert alr_1 unacknowledged', route: '/history/usage' }, { ref: 'conversations/message/m_x', kind: 'chat', excerpt: '“why does it keep saying unknown”', route: '/conversations' }], createdAt: minutesAgo(600) },
]

export async function listCandidates(): Promise<Snapshot<ImprovementCandidate[]>> {
  await wait()
  return snapshot(candidates)
}

export async function recordDecision(id: string, decision: 'accepted' | 'rejected', note: string): Promise<Operation<ImprovementCandidate>> {
  await wait(260)
  const item = candidates.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  if (item.authority === 'pending_brief' && decision === 'accepted') return failedOperation('authority_pending', false, 'Automatic change authority for this change type is not yet defined by the brief. The evidence is recorded; execution waits.')
  const next: ImprovementCandidate = { ...item, status: decision, decision: { by: 'you', at: nowIso(), note } }
  candidates = candidates.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function evaluateCandidate(id: string): Promise<Operation<ImprovementCandidate>> {
  await wait(1400)
  const item = candidates.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: ImprovementCandidate = { ...item, status: 'evaluating', evaluation: { criteria: [{ name: 'Links to real observations', baseline: 'required', result: `${item.evidence.length} refs resolved`, met: true }, { name: 'Measurement criteria declared', baseline: 'required', result: item.measurement ? 'yes' : 'no', met: Boolean(item.measurement) }, { name: 'Usefulness vs engagement', baseline: 'corrections considered', result: 'pending', met: undefined }], note: 'Evaluation records evidence; insufficient data yields an unproven hypothesis, not a confident redesign.', at: nowIso() } }
  candidates = candidates.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}
