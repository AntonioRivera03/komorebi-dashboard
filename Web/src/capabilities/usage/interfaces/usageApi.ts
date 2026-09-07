import { daysFromNow, minutesAgo, snapshot, wait } from '../../../shared/api/mock'
import type { Snapshot } from '../../../shared/contracts/common'
import type { UsageObservation, UsageReport } from './types'

/* Usage HTTP adapter (mock): /api/v1/usage/... Aggregates carry denominators, windows and coverage. */

export async function queryUsage(window: '7d' | '30d', capability?: string): Promise<Snapshot<UsageReport>> {
  await wait(320)
  const days = window === '7d' ? 7 : 30
  const daily = Array.from({ length: days }, (_, index) => 20 + Math.round(30 * Math.abs(Math.sin(index * 1.3))) + (index % 7 === 5 ? -15 : 0))
  const report: UsageReport = {
    window: { from: daysFromNow(-days), to: new Date().toISOString(), coverage: window === '30d' ? 'partial' : 'complete' },
    dailyActivity: daily,
    capabilities: [
      { capability: 'tasks', events: 412 },
      { capability: 'study', events: 388 },
      { capability: 'today', events: 301 },
      { capability: 'home', events: 274 },
      { capability: 'capture', events: 190 },
      { capability: 'assistant', events: 121 },
      { capability: 'knowledge', events: 96 },
      { capability: 'calendar', events: 74 },
    ].filter((item) => !capability || item.capability === capability),
    workflows: [
      { workflow: 'capture → task', capability: 'capture', started: 41, completed: 33, abandoned: 6, failed: 2, medianSeconds: 48 },
      { workflow: 'study session', capability: 'study', started: 14, completed: 11, abandoned: 3, failed: 0, medianSeconds: 1620 },
      { workflow: 'scene apply', capability: 'home', started: 58, completed: 52, abandoned: 0, failed: 6, medianSeconds: 3 },
      { workflow: 'assistant proposal → confirm', capability: 'assistant', started: 9, completed: 5, abandoned: 3, failed: 1, medianSeconds: 95 },
      { workflow: 'calendar block', capability: 'calendar', started: 12, completed: 10, abandoned: 2, failed: 0, medianSeconds: 40 },
    ].filter((item) => !capability || item.capability === capability),
    suggestions: [
      { kind: 'capture destination', presented: 38, opened: 30, accepted: 22, edited: 6, dismissed: 4 },
      { kind: 'today card', presented: 210, opened: 96, accepted: 61, edited: 0, dismissed: 19 },
      { kind: 'goal breakdown', presented: 12, opened: 12, accepted: 7, edited: 3, dismissed: 2 },
      { kind: 'connection', presented: 6, opened: 6, accepted: 2, edited: 1, dismissed: 2 },
    ],
    ai: [
      { capability: 'study', requests: 44, tokensIn: 181000, tokensOut: 39000, estimatedCents: 260, usefulOutcomes: 31 },
      { capability: 'assistant', requests: 27, tokensIn: 210000, tokensOut: 22000, estimatedCents: 240, usefulOutcomes: 15 },
      { capability: 'capture', requests: 38, tokensIn: 19000, tokensOut: 6000, estimatedCents: 30, usefulOutcomes: 28 },
      { capability: 'briefings', requests: 7, tokensIn: 52000, tokensOut: 4000, estimatedCents: 55, usefulOutcomes: 5 },
    ],
    recent: ([
      { id: 'ob_1', at: minutesAgo(3), capability: 'today', action: 'card.opened', kind: 'acceptance', correlationId: 'c_91', release: '0.3.1', resource: 'tasks/task/tsk_1', route: '/tasks/tsk_1' },
      { id: 'ob_2', at: minutesAgo(12), capability: 'home', action: 'scene.apply', kind: 'completion', workflowId: 'wf_scene_44', correlationId: 'c_88', release: '0.3.1', durationMs: 2900, outcome: 'partial' },
      { id: 'ob_3', at: minutesAgo(40), capability: 'assistant', action: 'proposal.confirm', kind: 'start', workflowId: 'wf_prop_1', correlationId: 'c_80', release: '0.3.1' },
      { id: 'ob_4', at: minutesAgo(41), capability: 'assistant', action: 'answer.presented', kind: 'presentation', correlationId: 'c_80', release: '0.3.1' },
      { id: 'ob_5', at: minutesAgo(1300), capability: 'study', action: 'feedback.request', kind: 'failure', workflowId: 'wf_ses_2', correlationId: 'c_51', release: '0.3.0', outcome: 'provider_timeout' },
      { id: 'ob_6', at: minutesAgo(1390), capability: 'study', action: 'attempt.record', kind: 'completion', workflowId: 'wf_ses_2', correlationId: 'c_50', release: '0.3.0', durationMs: 420 },
    ] as UsageObservation[]).filter((item) => !capability || item.capability === capability),
    gaps: window === '30d' ? ['Client navigation events before release 0.3.0 were not collected; abandonment is under-counted for that period.'] : [],
  }
  return snapshot(report)
}
