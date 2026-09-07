import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { Select } from '../../../shared/ui/Select'
import { Sparkbars } from '../../../shared/ui/Sparkbars'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useUsage } from '../interfaces/useUsage'
import { AiCostTable } from '../components/AiCostTable'
import { ObservationRow } from '../components/ObservationRow'
import { SuggestionTable } from '../components/SuggestionTable'
import { WorkflowTable } from '../components/WorkflowTable'
import styles from '../usage.module.css'

export default function UsagePage() {
  const [window, setWindow] = useState<'7d' | '30d'>('7d')
  const [capability, setCapability] = useState('')
  const usage = useUsage(window, capability || undefined)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Usage · E01"
        title="How Komorebi is actually used"
        subtitle="Which capabilities are used, which workflows succeed or stall, which suggestions land, and how AI cost relates to useful outcomes."
        actions={
          <>
            <SegmentedControl label="Window" value={window} onChange={setWindow} options={[{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }]} />
            <Select aria-label="Capability" value={capability} onChange={(event) => setCapability(event.target.value)} style={{ width: 'auto' }} options={[{ value: '', label: 'Every capability' }, ...['tasks', 'study', 'today', 'home', 'capture', 'assistant', 'knowledge', 'calendar'].map((item) => ({ value: item, label: item }))]} />
          </>
        }
      />
      <AsyncPanel query={usage} skeletonLines={8}>
        {({ data }) => (
          <>
            {data.gaps.length ? <Notice tone="warn" glyph="!">{data.gaps.join(' ')}</Notice> : null}
            <div className="k-grid k-grid--2" style={{ marginTop: 8 }}>
              <div>
                <Panel flush>
                  <PanelHead title="Daily activity" eyebrow={`${window} · coverage ${data.window.coverage}`} meta={<StatusPill tone={data.window.coverage === 'complete' ? 'ok' : 'warn'}>{data.window.coverage}</StatusPill>} />
                  <Sparkbars values={data.dailyActivity} labels={data.dailyActivity.map((value, index) => `day ${index + 1}: ${value} events`)} highlightIndex={data.dailyActivity.length - 1} ariaLabel="Daily interaction count" />
                  <div style={{ marginTop: 16 }}>
                    {data.capabilities.map((item) => (
                      <div key={item.capability} className={styles.capBar}>
                        <span>{item.capability}</span>
                        <i style={{ width: `${(item.events / Math.max(...data.capabilities.map((c) => c.events))) * 100}%` }} />
                        <span className="mono muted small">{item.events}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <PanelHead title="Workflows" eyebrow="Started → completed · abandoned · failed" />
                  <WorkflowTable workflows={data.workflows} />
                </Panel>
              </div>
              <div>
                <Panel flush>
                  <PanelHead title="Suggestions" eyebrow="Presented ≠ accepted ≠ completed" />
                  <SuggestionTable suggestions={data.suggestions} />
                </Panel>
                <Panel>
                  <PanelHead title="AI usage and outcomes" eyebrow="Estimated vs provider-reported" />
                  <AiCostTable ai={data.ai} />
                </Panel>
                <Panel>
                  <PanelHead title="Recent observations" eyebrow="Stable IDs · correlation · release" />
                  {data.recent.map((observation) => (
                    <ObservationRow key={observation.id} observation={observation} />
                  ))}
                </Panel>
              </div>
            </div>
          </>
        )}
      </AsyncPanel>
    </div>
  )
}
