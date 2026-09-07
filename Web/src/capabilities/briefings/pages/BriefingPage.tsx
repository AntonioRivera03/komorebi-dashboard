import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useBriefing } from '../interfaces/useBriefing'
import { captureFromItem, muteRule, refreshBriefing, setBudget, unmute } from '../interfaces/briefingsApi'
import { BriefingItemCard } from '../components/BriefingItemCard'
import { BudgetControl } from '../components/BudgetControl'
import { MuteList } from '../components/MuteList'

export default function BriefingPage() {
  const briefing = useBriefing()
  const toast = useToast()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    const result = await refreshBriefing()
    setRefreshing(false)
    if (result.status === 'completed') briefing.reload()
  }

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Briefings · I02"
        title="Morning briefing"
        subtitle="A short digest tied to your commitments and interests. Every item keeps its source and freshness; synthesis is clearly separated from fetched facts."
        actions={
          <>
            <Link to={routes.briefingSources}>
              <Button icon="settings">Sources</Button>
            </Link>
            <Button variant="primary" icon="refresh" busy={refreshing} onClick={refresh}>
              Refresh deliberately
            </Button>
          </>
        }
      />
      <AsyncPanel query={briefing} skeletonLines={8}>
        {(snapshot) => (
          <div className="k-grid k-grid--sidebar">
            <div className="k-stack" style={{ gap: 14 }}>
              <div className="k-row k-row--between">
                <span className="label">
                  {snapshot.data.items.filter((item) => !item.generated).length} sourced items · budget {snapshot.data.budget}
                </span>
                <FreshnessBadge freshness={snapshot.freshness} observedAt={snapshot.data.generatedAt} prefix="generated" />
              </div>
              {snapshot.data.aiStatus === 'failed' ? <Notice tone="warn" glyph="!">Synthesis failed; the ranked source cards below are complete on their own.</Notice> : null}
              {snapshot.data.items.map((item) => (
                <BriefingItemCard
                  key={item.id}
                  item={item}
                  onMute={async (kind, value) => {
                    await muteRule(kind, value)
                    toast(`Muted ${kind} “${value}” · applies before the next digest`, { action: { label: 'Regenerate', onClick: refresh } })
                    briefing.reload()
                  }}
                  onCapture={async (entry) => {
                    const result = await captureFromItem(entry.id)
                    if (result.status === 'completed') toast('Saved to the inbox · nothing auto-enrolled for study')
                  }}
                />
              ))}
            </div>
            <aside className="k-stack">
              <Panel flush>
                <PanelHead title="Budget" />
                <BudgetControl
                  budget={snapshot.data.budget}
                  onChange={async (value) => {
                    briefing.mutate((current) => ({ ...current, budget: value }))
                    await setBudget(value)
                  }}
                />
              </Panel>
              <Panel>
                <PanelHead title="Muted" />
                <MuteList
                  muted={snapshot.data.muted}
                  onUnmute={async (kind, value) => {
                    await unmute(kind, value)
                    briefing.reload()
                  }}
                />
              </Panel>
              <Panel>
                <PanelHead title="Providers" />
                <div className="k-row">
                  {snapshot.data.providerStatus.map((provider) => (
                    <StatusPill key={provider.name} tone={provider.status === 'ok' ? 'ok' : provider.status === 'failed' ? 'danger' : 'warn'} dot>
                      {provider.name}
                    </StatusPill>
                  ))}
                </div>
                <p className="muted small" style={{ marginTop: 10 }}>
                  A failed provider leaves a dated previous briefing or “unavailable”, never a fabricated weather reading. No infinite generated feed.
                </p>
              </Panel>
            </aside>
          </div>
        )}
      </AsyncPanel>
    </div>
  )
}
