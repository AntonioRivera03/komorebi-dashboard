import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { Adjustment, ModuleSummary, Reflection } from './types'

const summaries: ModuleSummary[] = [
  { module: 'tasks', coverage: 'complete', lines: ['9 completed · 2 canceled · 1 overdue', 'Most completions Tue–Thu mornings'], freshness: minutesAgo(10) },
  { module: 'study', coverage: 'complete', lines: ['3 sessions · 11 attempts · 4 with AI feedback', 'Checkpoint left on working memory'], freshness: minutesAgo(15) },
  { module: 'home', coverage: 'partial', lines: ['Evening scene applied 5 evenings', 'Balcony sensor unavailable since Thursday — data missing, not zero'], freshness: minutesAgo(5) },
  { module: 'training', coverage: 'unavailable', lines: ['Capability not enabled'], freshness: minutesAgo(0) },
]

let reflection: Reflection = { weekKey: 'this-week', mattered: '', difficult: '', change: '', adjustments: [{ id: 'adj_1', label: 'Pause goal “Run a 10K comfortably”', owner: 'goals', command: 'setGoalStatus(goal_3, paused)', status: 'proposed' }, { id: 'adj_2', label: 'Reduce habit “Review 10 due cards” to weekdays', owner: 'habits', command: 'updateCadence(hb_2, weekdays)', status: 'proposed' }] }

export async function getWeek(): Promise<Snapshot<{ summaries: ModuleSummary[]; reflection: Reflection }>> {
  await wait()
  return snapshot({ summaries, reflection })
}

export async function saveReflection(patch: Pick<Reflection, 'mattered' | 'difficult' | 'change'>): Promise<Operation<Reflection>> {
  await wait(260)
  reflection = { ...reflection, ...patch, savedAt: nowIso() }
  return completed(reflection)
}

export async function draftWithAi(selected: string[]): Promise<Reflection['aiDraft']> {
  await wait(1300)
  return { text: 'Study work clustered mid-week and the working-memory checkpoint captured a real open question. The home data has a gap since Thursday, so nothing can be said about the balcony. Tasks were mostly admin; consider whether the two canceled ones should return.', basedOn: selected }
}

export async function applyAdjustment(id: string): Promise<Operation<Adjustment>> {
  await wait(700)
  const adjustment = reflection.adjustments.find((item) => item.id === id)
  if (!adjustment) return failedOperation('not_found', false)
  if (adjustment.status === 'applied') return completed(adjustment)
  adjustment.status = id === 'adj_2' ? 'failed' : 'applied'
  return adjustment.status === 'failed' ? failedOperation('owner_rejected', true, 'Habits rejected the cadence change: revision conflict. The reflection is saved; retry when ready.') : completed({ ...adjustment })
}

export function newAdjustmentId() {
  return newId('adj')
}
