import { useEffect, useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { Field } from '../../../shared/ui/Field'
import { TextArea } from '../../../shared/ui/TextArea'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { useWeek } from '../interfaces/useWeek'
import { applyAdjustment, draftWithAi, saveReflection } from '../interfaces/reflectionApi'
import { AdjustmentRow } from '../components/AdjustmentRow'
import { ModuleSummaryCard } from '../components/ModuleSummaryCard'
import styles from '../reflection.module.css'

export default function ReflectionPage() {
  const week = useWeek()
  const toast = useToast()
  const [selected, setSelected] = useState<string[]>([])
  const [mattered, setMattered] = useState('')
  const [difficult, setDifficult] = useState('')
  const [change, setChange] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (week.status === 'ready') {
      setSelected(week.snapshot.data.summaries.filter((summary) => summary.coverage !== 'unavailable').map((summary) => summary.module))
      setMattered(week.snapshot.data.reflection.mattered)
      setDifficult(week.snapshot.data.reflection.difficult)
      setChange(week.snapshot.data.reflection.change)
    }
  }, [week.status, week.snapshot])

  return (
    <div className="k-page">
      <PageHeader eyebrow="Reflection · M03 · undecided" title="This week, with perspective" subtitle="Sourced summaries beside what mattered, what was difficult and what to change. A narrative, not a score." actions={<StatusPill tone="warn">undecided</StatusPill>} />
      <AsyncPanel query={week} skeletonLines={8}>
        {({ data }) => (
          <div className="k-grid k-grid--2">
            <div>
              <Panel flush>
                <PanelHead title="Sourced summaries" eyebrow="Choose what the draft may use" />
                <div className="k-stack">
                  {data.summaries.map((summary) => (
                    <ModuleSummaryCard key={summary.module} summary={summary} selected={selected.includes(summary.module)} onToggle={() => setSelected((current) => (current.includes(summary.module) ? current.filter((item) => item !== summary.module) : [...current, summary.module]))} />
                  ))}
                </div>
              </Panel>
              <Panel>
                <PanelHead title="Adjustments" eyebrow="Applied by their owners, exactly once" />
                {data.reflection.adjustments.map((adjustment) => (
                  <AdjustmentRow
                    key={adjustment.id}
                    adjustment={adjustment}
                    busy={busyId === adjustment.id}
                    onApply={async (item) => {
                      setBusyId(item.id)
                      const result = await applyAdjustment(item.id)
                      setBusyId(null)
                      if (result.status === 'completed') {
                        week.mutate((current) => ({ ...current, reflection: { ...current.reflection, adjustments: current.reflection.adjustments.map((entry) => (entry.id === item.id ? result.value : entry)) } }))
                        toast('Adjustment applied by its owner')
                      } else if (result.status === 'failed') {
                        week.mutate((current) => ({ ...current, reflection: { ...current.reflection, adjustments: current.reflection.adjustments.map((entry) => (entry.id === item.id ? { ...entry, status: 'failed' } : entry)) } }))
                        toast(result.message ?? 'Failed', { tone: 'warn' })
                      }
                    }}
                  />
                ))}
              </Panel>
            </div>
            <Panel flush>
              <PanelHead
                title="Your reflection"
                eyebrow={data.reflection.savedAt ? `saved ${new Date(data.reflection.savedAt).toLocaleTimeString()}` : 'unsaved'}
                actions={
                  <Button
                    icon="sparkle"
                    size="sm"
                    busy={drafting}
                    onClick={async () => {
                      setDrafting(true)
                      const draft = await draftWithAi(selected)
                      setDrafting(false)
                      if (draft) {
                        setMattered(draft.text)
                        toast(`Draft based on ${draft.basedOn.join(', ')} · edit freely`)
                      }
                    }}
                  >
                    Draft from selected
                  </Button>
                }
              />
              <div className={`k-form ${styles.editor}`}>
                <Field label="What mattered">
                  <TextArea rows={5} value={mattered} onChange={(event) => setMattered(event.target.value)} />
                </Field>
                <Field label="What was difficult">
                  <TextArea rows={3} value={difficult} onChange={(event) => setDifficult(event.target.value)} />
                </Field>
                <Field label="What to change">
                  <TextArea rows={3} value={change} onChange={(event) => setChange(event.target.value)} />
                </Field>
                <div className="k-row k-row--between">
                  <span className="muted small">Raw narrative stays private; generated interpretation is not evidence of mood or health.</span>
                  <Button
                    variant="primary"
                    busy={saving}
                    onClick={async () => {
                      setSaving(true)
                      const result = await saveReflection({ mattered, difficult, change })
                      setSaving(false)
                      if (result.status === 'completed') {
                        week.mutate((current) => ({ ...current, reflection: result.value }))
                        toast('Reflection saved')
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
                {data.summaries.some((summary) => summary.coverage !== 'complete') ? <Notice tone="warn" glyph="!">Some areas have partial or unavailable data this week. The reflection says so rather than pretending.</Notice> : null}
              </div>
            </Panel>
          </div>
        )}
      </AsyncPanel>
    </div>
  )
}
