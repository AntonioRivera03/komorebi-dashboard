import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Switch } from '../../../shared/ui/Switch'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { LifecycleTrail } from '../../../shared/ui/LifecycleTrail'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useConnection } from '../interfaces/useConnection'
import { useOperations } from '../interfaces/useOperations'
import { reconcileOperation, toggleCalendar } from '../interfaces/calendarApi'
import styles from '../calendar.module.css'

const steps = [
  { id: 'queued', label: 'queued' },
  { id: 'sending', label: 'sending' },
  { id: 'synced', label: 'synced' },
]

export default function CalendarConnectionsPage() {
  const connection = useConnection()
  const operations = useOperations()
  const toast = useToast()
  const [reconciling, setReconciling] = useState<string | null>(null)

  return (
    <div className="k-page">
      <PageHeader back={{ to: routes.calendar, label: 'Calendar' }} eyebrow="Calendar · connections" title="Connections" subtitle="Read-only first. Writes arrive later, reviewed, with an operation ledger and reconciliation for ambiguous outcomes." />
      <div className="k-grid k-grid--2">
        <Panel flush>
          <PanelHead title="Provider" eyebrow="Credential stored as a secret reference" />
          <AsyncPanel query={connection} skeletonLines={4}>
            {({ data }) => (
              <>
                <div className="k-row" style={{ marginBottom: 14 }}>
                  <StatusPill tone={data.status === 'synced' ? 'ok' : 'warn'} live>
                    {data.provider} · {data.account}
                  </StatusPill>
                  <StatusPill>{data.mode}</StatusPill>
                </div>
                {data.calendars.map((cal) => (
                  <div key={cal.id} className={styles.calRow}>
                    <span>
                      <i style={{ background: cal.color }} />
                      {cal.name}
                    </span>
                    <Switch
                      label={`Mirror ${cal.name}`}
                      checked={cal.enabled}
                      onChange={async () => {
                        const result = await toggleCalendar(cal.id)
                        if (result.status === 'completed') connection.mutate(() => result.value)
                      }}
                    />
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <Notice glyph="⚠">Expired credentials pause sync and ask you to reconnect; local blocks are never deleted.</Notice>
                </div>
              </>
            )}
          </AsyncPanel>
        </Panel>
        <Panel flush>
          <PanelHead title="Provider operations" eyebrow="Ledger · idempotent by correlation marker" />
          <AsyncPanel query={operations} skeletonLines={3}>
            {({ data }) =>
              data.map((op) => (
                <div key={op.id} className={styles.opRow}>
                  <div>
                    <strong style={{ fontWeight: 500 }}>{op.title}</strong>
                    <small>{op.detail}</small>
                    <div style={{ marginTop: 8 }}>
                      <LifecycleTrail steps={steps} current={op.state} exception={['unknown_outcome', 'failed', 'conflict', 'canceled'].includes(op.state) ? { label: op.state.replace('_', ' '), tone: op.state === 'failed' ? 'failed' : 'warn' } : undefined} />
                    </div>
                  </div>
                  {op.state === 'unknown_outcome' ? (
                    <Button
                      size="sm"
                      icon="refresh"
                      busy={reconciling === op.id}
                      onClick={async () => {
                        setReconciling(op.id)
                        const result = await reconcileOperation(op.id)
                        setReconciling(null)
                        if (result.status === 'completed') {
                          operations.mutate((items) => items.map((item) => (item.id === op.id ? result.value : item)))
                          toast('Reconciled · no duplicate created')
                        }
                      }}
                    >
                      Reconcile
                    </Button>
                  ) : null}
                </div>
              ))
            }
          </AsyncPanel>
        </Panel>
      </div>
    </div>
  )
}
