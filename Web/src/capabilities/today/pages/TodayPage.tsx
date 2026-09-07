import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { useToast } from '../../../shared/ui/useToast'
import { useSession } from '../../../app/providers/useSession'
import { useToday } from '../interfaces/useToday'
import { dismissContribution, pinReference, restoreDismissed, updateLayout } from '../interfaces/todayApi'
import { AgendaWidget } from '../components/AgendaWidget'
import { ArrangePanel } from '../components/ArrangePanel'
import { ContextRibbon } from '../components/ContextRibbon'
import { ContributionGrid } from '../components/ContributionGrid'
import { HomeWidget } from '../components/HomeWidget'
import { WelcomeHero } from '../components/WelcomeHero'
import styles from '../today.module.css'

export default function TodayPage() {
  const today = useToday()
  const toast = useToast()
  const { session } = useSession()
  const [arranging, setArranging] = useState(false)
  const displayOnly = session.principal === 'display'

  const onPin = async (key: string, pinned: boolean) => {
    const result = await pinReference(key, pinned)
    if (result.status === 'completed') today.mutate((data) => ({ ...data, layout: result.value }))
  }

  const onDismiss = async (key: string, period: 'hour' | 'today' | 'week') => {
    const result = await dismissContribution(key, period)
    if (result.status === 'completed') {
      today.mutate((data) => ({ ...data, contributions: data.contributions.filter((item) => item.key !== key), dismissals: [...data.dismissals, result.value] }))
      toast(`Dismissed for ${period === 'hour' ? 'an hour' : period === 'today' ? 'today' : 'a week'}`, { action: { label: 'Undo', onClick: () => onRestore(key) } })
    }
  }

  const onRestore = async (key: string) => {
    await restoreDismissed(key)
    today.reload()
  }

  return (
    <div className="k-page" style={{ paddingBottom: 20 }}>
      {today.snapshot ? (
        <WelcomeHero weather={displayOnly ? today.snapshot.data.weather : today.snapshot.data.weather} cardCount={Math.min(today.snapshot.data.limit, today.snapshot.data.contributions.length)} exceptionCount={today.snapshot.data.contributions.filter((item) => item.kind === 'exception').length} />
      ) : (
        <PageHeader title="Today" eyebrow="Assembling a bounded view" />
      )}
      {today.snapshot ? (
        <ContextRibbon inboxCount={today.snapshot.data.inboxCount} producersOk={today.snapshot.data.producers.filter((item) => item.status === 'ok').length} producersTotal={today.snapshot.data.producers.filter((item) => item.status !== 'disabled').length} homeConnection="linked" />
      ) : null}
      <div className={styles.dashboard}>
        <div className="k-stack" style={{ gap: 0 }}>
          <Panel>
            <PanelHead
              title="What matters now"
              eyebrow="Today · I01"
              meta={today.snapshot ? <StatusPill>{Math.min(today.snapshot.data.limit, today.snapshot.data.contributions.length)} of max {today.snapshot.data.limit}</StatusPill> : null}
              actions={
                <Button size="sm" icon="grid" onClick={() => setArranging(true)}>
                  Arrange
                </Button>
              }
            />
            <AsyncPanel query={today} skeletonLines={6}>
              {({ data }) => <ContributionGrid contributions={data.contributions} layout={data.layout} limit={data.limit} displayOnly={displayOnly} onPin={onPin} onDismiss={onDismiss} />}
            </AsyncPanel>
          </Panel>
          <AgendaWidget />
        </div>
        <div className="k-stack" style={{ gap: 0 }}>
          <HomeWidget />
          {!displayOnly && today.snapshot ? (
            <Panel>
              <PanelHead title="Quiet by design" eyebrow="Rules enforced in code" />
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
                At most {today.snapshot.data.limit} cards. Urgent exceptions first, then the next fixed commitment, then what you pinned, then ordinary suggestions. Each producer answers within a short timeout; a slow one is shown as cached and labelled stale. Opening a card revalidates at its owner, because Today never owns a task, note or device.
              </p>
            </Panel>
          ) : null}
        </div>
      </div>
      {today.snapshot ? (
        <ArrangePanel
          open={arranging}
          layout={today.snapshot.data.layout}
          producers={today.snapshot.data.producers}
          dismissals={today.snapshot.data.dismissals}
          onClose={() => setArranging(false)}
          onRestore={onRestore}
          onChange={async (layout) => {
            today.mutate((data) => ({ ...data, layout }))
            await updateLayout(layout)
          }}
        />
      ) : null}
    </div>
  )
}
