import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { useRules } from '../interfaces/useRules'
import { saveRuleDraft, setRuleStatus, simulateRule } from '../interfaces/automationApi'
import type { AutomationRule, SimulationResult } from '../interfaces/types'
import { RuleCard } from '../components/RuleCard'
import { RuleDraftDialog } from '../components/RuleDraftDialog'
import { RunInspectorPanel } from '../components/RunInspectorPanel'
import { SimulationDialog } from '../components/SimulationDialog'

export default function AutomationsPage() {
  const rules = useRules()
  const toast = useToast()
  const [simulating, setSimulating] = useState<string | null>(null)
  const [simulation, setSimulation] = useState<{ rule: AutomationRule; result: SimulationResult } | null>(null)
  const [inspecting, setInspecting] = useState<AutomationRule | null>(null)
  const [drafting, setDrafting] = useState(false)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Automation · I05 · undecided"
        title="Routines that connect home and life"
        subtitle="Explicit event-and-condition rules over a finite registry. Simulate before enabling; inspect every run and step."
        actions={
          <>
            <StatusPill tone="warn">undecided · manual scene buttons cover the same benefit</StatusPill>
            <Button variant="primary" icon="plus" onClick={() => setDrafting(true)}>
              New rule
            </Button>
          </>
        }
      />
      <div className="k-grid k-grid--sidebar">
        <AsyncPanel query={rules} skeletonLines={8}>
          {({ data }) => (
            <div className="k-stack" style={{ gap: 14 }}>
              {data.rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  busy={simulating === rule.id}
                  onInspect={setInspecting}
                  onSimulate={async (item) => {
                    setSimulating(item.id)
                    const result = await simulateRule(item.id)
                    setSimulating(null)
                    if (result.status === 'completed') setSimulation({ rule: item, result: result.value })
                  }}
                  onToggle={async (item) => {
                    const result = await setRuleStatus(item.id, item.status === 'enabled' ? 'paused' : 'enabled')
                    if (result.status === 'completed') {
                      rules.mutate((current) => ({ ...current, rules: current.rules.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                      toast(result.value.status === 'paused' ? 'Paused · pending steps stop at their next cancellation check' : 'Enabled')
                    }
                  }}
                />
              ))}
            </div>
          )}
        </AsyncPanel>
        <aside className="k-stack">
          <Notice glyph="⚙">Per-rule cooldown, run frequency and causation depth stop loops. Self-triggering cycles are rejected where detectable.</Notice>
          <Notice glyph="⛨">A run checks enabled status, the current grant and fresh condition inputs. Stale permissions stop an otherwise valid rule. A failed light never corrupts the study session that triggered it.</Notice>
        </aside>
      </div>
      <SimulationDialog result={simulation?.result ?? null} ruleName={simulation?.rule.name ?? ''} onClose={() => setSimulation(null)} />
      <RunInspectorPanel open={inspecting !== null} ruleName={inspecting?.name ?? ''} runs={rules.snapshot?.data.runs.filter((run) => run.ruleId === inspecting?.id) ?? []} onClose={() => setInspecting(null)} />
      <RuleDraftDialog
        open={drafting}
        onClose={() => setDrafting(false)}
        onSave={async (draft) => {
          const result = await saveRuleDraft(draft)
          if (result.status === 'completed') {
            rules.mutate((current) => ({ ...current, rules: [...current.rules, result.value] }))
            setDrafting(false)
            toast('Draft saved · simulate, then enable')
          } else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'danger' })
        }}
      />
    </div>
  )
}
