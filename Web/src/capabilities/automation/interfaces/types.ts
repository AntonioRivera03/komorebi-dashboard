export type RuleStatus = 'draft' | 'enabled' | 'paused'
export type RunStatus = 'completed' | 'partial' | 'failed' | 'skipped' | 'canceled' | 'running'

export type AutomationRule = {
  id: string
  name: string
  revision: number
  status: RuleStatus
  trigger: { type: string; label: string }
  conditions: { predicate: string; label: string }[]
  actions: { command: string; label: string; idempotent: boolean }[]
  grant: { scopes: string[]; grantedAt: string }
  cooldownMinutes: number
  maxRunsPerDay: number
  preview: string
}

export type RunStep = { id: string; command: string; status: 'completed' | 'failed' | 'skipped' | 'pending'; detail: string; idempotencyKey: string }
export type AutomationRun = { id: string; ruleId: string; ruleName: string; ruleRevision: number; triggerEventId: string; startedAt: string; status: RunStatus; steps: RunStep[]; evaluated: { ref: string; revision: number }[] }
export type SimulationResult = { wouldRun: boolean; reasons: string[]; steps: { command: string; label: string }[] }
