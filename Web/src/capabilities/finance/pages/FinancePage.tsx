import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatTile } from '../../../shared/ui/StatTile'
import { Notice } from '../../../shared/ui/Notice'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../shared/ui/useToast'
import { useSession } from '../../../app/providers/useSession'
import { formatMoney } from '../../../shared/lib/format'
import { useFinanceSummary } from '../interfaces/useFinanceSummary'
import { markPaid, recordBalance, requestReminder } from '../interfaces/financeApi'
import { ObligationRow } from '../components/ObligationRow'
import { SavingsCard } from '../components/SavingsCard'
import styles from '../finance.module.css'

export default function FinancePage() {
  const summary = useFinanceSummary()
  const toast = useToast()
  const { session } = useSession()

  if (session.principal === 'display') {
    return (
      <div className="k-page">
        <PageHeader eyebrow="Finance · M07" title="Financial shelf" />
        <EmptyState glyph="⛨" title="Not available on a display session">Balances and private descriptions are excluded from display-role summaries by the server.</EmptyState>
      </div>
    )
  }

  return (
    <div className="k-page">
      <PageHeader eyebrow="Finance · M07 · interested" title="Financial shelf" subtitle="Bills, renewals and self-defined savings, visible when useful. Manual records with entry dates; no bank connection, no transactions." actions={<StatusPill tone="warn">interested · manual only</StatusPill>} />
      <AsyncPanel query={summary} skeletonLines={8}>
        {({ data }) => (
          <>
            <div className={styles.totals}>
              {data.monthTotals.map((total) => (
                <StatTile key={total.currency} value={formatMoney(total.minor, total.currency)} label={`due this cycle · ${total.currency}`} />
              ))}
              <StatTile value={data.obligations.filter((item) => item.reminder).length} label="with reminders" />
            </div>
            {data.conversionNote ? <Notice glyph="※">{data.conversionNote}</Notice> : null}
            <div className="k-grid k-grid--2" style={{ marginTop: 8 }}>
              <Panel>
                <PanelHead title="Upcoming" eyebrow="Bills and subscriptions" />
                {data.obligations
                  .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
                  .map((obligation) => (
                    <ObligationRow
                      key={obligation.id}
                      obligation={obligation}
                      onPaid={async (item) => {
                        const result = await markPaid(item.id)
                        if (result.status === 'completed') {
                          summary.mutate((current) => ({ ...current, obligations: current.obligations.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                          toast('Payment recorded manually · completing a reminder never claims a bill was paid')
                        }
                      }}
                      onReminder={async (item, channel) => {
                        const result = await requestReminder(item.id, channel, 2)
                        if (result.status === 'completed') {
                          summary.mutate((current) => ({ ...current, obligations: current.obligations.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                          toast(`Reminder requested via ${channel} with title and date only`)
                        }
                      }}
                    />
                  ))}
              </Panel>
              <Panel>
                <PanelHead title="Savings targets" eyebrow="Self-defined" />
                <div className="k-stack">
                  {data.savings.map((target) => (
                    <SavingsCard
                      key={target.id}
                      target={target}
                      onBalance={async (item, minor) => {
                        const result = await recordBalance(item.id, minor)
                        if (result.status === 'completed') summary.mutate((current) => ({ ...current, savings: current.savings.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Notice glyph="⛨">Money is stored as exact minor units with a currency. Precision survives export and import. Records are inaccessible to a paired display.</Notice>
                </div>
              </Panel>
            </div>
          </>
        )}
      </AsyncPanel>
    </div>
  )
}
