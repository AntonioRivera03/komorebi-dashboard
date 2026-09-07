import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { useToast } from '../../../shared/ui/useToast'
import { useAlerts } from '../interfaces/useAlerts'
import { acknowledgeAlert, configureRule, snoozeAlert, toggleRule } from '../interfaces/homeAlertsApi'
import type { AlertRule } from '../interfaces/types'
import { AlertCard } from '../components/AlertCard'
import { RuleEditorPanel } from '../components/RuleEditorPanel'
import { RuleRow } from '../components/RuleRow'

export default function AlertsPage() {
  const data = useAlerts()
  const toast = useToast()
  const [editing, setEditing] = useState<AlertRule | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Home Alerts · H03"
        title="Only what matters"
        subtitle="A bounded set of rules for exceptions worth attention. Routine readings stay quiet; unknown state is never treated as safe."
        actions={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
          >
            New rule
          </Button>
        }
      />
      <div className="k-grid k-grid--2">
        <div>
          <AsyncPanel query={data} isEmpty={(value) => value.alerts.length === 0} empty={<EmptyState glyph="○" title="Nothing needs attention">Alerts open once per episode, with the observations that triggered them.</EmptyState>} skeletonLines={6}>
            {({ data: value }) => (
              <div className="k-stack" style={{ gap: 14 }}>
                {value.alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    busy={busyId === alert.id}
                    onAcknowledge={async (item) => {
                      setBusyId(item.id)
                      const result = await acknowledgeAlert(item.id)
                      setBusyId(null)
                      if (result.status === 'completed') {
                        data.mutate((current) => ({ ...current, alerts: current.alerts.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                        toast('Acknowledged · Today updated even if notification delivery failed')
                      }
                    }}
                    onSnooze={async (item, hours) => {
                      const result = await snoozeAlert(item.id, hours)
                      if (result.status === 'completed') {
                        data.mutate((current) => ({ ...current, alerts: current.alerts.filter((entry) => entry.id !== item.id) }))
                        toast(`Snoozed for ${hours} h · the condition is still tracked`)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </AsyncPanel>
        </div>
        <Panel flush>
          <PanelHead title="Rules" eyebrow="Bounded, deterministic" meta={data.snapshot ? <StatusPill>{data.snapshot.data.rules.filter((rule) => rule.enabled).length} enabled</StatusPill> : null} />
          <AsyncPanel query={data} skeletonLines={3}>
            {({ data: value }) =>
              value.rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={(item) => {
                    setEditing(item)
                    setEditorOpen(true)
                  }}
                  onToggle={async (item) => {
                    const result = await toggleRule(item.id)
                    if (result.status === 'completed') data.mutate((current) => ({ ...current, rules: current.rules.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                  }}
                />
              ))
            }
          </AsyncPanel>
          <p className="muted small" style={{ marginTop: 14 }}>
            Household maintenance dates live in Household, not here. AI may add explanatory copy but never changes a condition, severity or recommended action.
          </p>
        </Panel>
      </div>
      <RuleEditorPanel
        open={editorOpen}
        rule={editing}
        busy={saving}
        onClose={() => setEditorOpen(false)}
        onSave={async (rule) => {
          setSaving(true)
          const result = await configureRule(rule)
          setSaving(false)
          if (result.status === 'completed') {
            data.reload()
            setEditorOpen(false)
            toast(`Rule saved · r${result.value.revision}`)
          }
        }}
      />
    </div>
  )
}
