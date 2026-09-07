import { useState } from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Popover } from '../../../shared/ui/Popover'
import { MenuItem } from '../../../shared/ui/MenuItem'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { formatLongDay } from '../../../shared/lib/format'
import { useGoal } from '../interfaces/useGoal'
import { useBreakdown } from '../interfaces/useBreakdown'
import { addMilestone, linkTaskDraft, setGoalStatus, setNextAction, toggleMilestone } from '../interfaces/goalsApi'
import type { BreakdownSuggestion, Goal } from '../interfaces/types'
import { ActionStateBadge } from '../components/ActionStateBadge'
import { BreakdownPanel } from '../components/BreakdownPanel'
import { DeclareAchievedDialog } from '../components/DeclareAchievedDialog'
import { EvidenceList } from '../components/EvidenceList'
import { LinkedActionList } from '../components/LinkedActionList'
import { MilestoneList } from '../components/MilestoneList'

export default function GoalDetailPage() {
  const { id } = useParams()
  const goal = useGoal(id)
  const breakdown = useBreakdown(id)
  const toast = useToast()
  const [breakingDown, setBreakingDown] = useState(false)
  const [declaring, setDeclaring] = useState<Goal | null>(null)
  const [busy, setBusy] = useState(false)

  const apply = async (command: () => Promise<{ status: string; value?: Goal }>, message?: string) => {
    setBusy(true)
    const result = await command()
    setBusy(false)
    if (result.status === 'completed' && result.value) {
      goal.mutate(() => result.value as Goal)
      if (message) toast(message)
    }
  }

  const acceptSuggestion = async (suggestion: BreakdownSuggestion) => {
    if (!id) return
    breakdown.decide(suggestion.id, 'accepted')
    if (suggestion.kind === 'milestone') await apply(() => addMilestone(id, suggestion.title), 'Milestone added')
    else await apply(() => linkTaskDraft(id, suggestion.title), 'Task created via Tasks and linked')
  }

  return (
    <div className="k-page">
      <AsyncPanel query={goal} skeletonLines={8}>
        {({ data }) => (
          <>
            <PageHeader
              back={{ to: routes.goals, label: 'Goals' }}
              eyebrow={
                <span className="k-row">
                  <StatusPill tone={data.status === 'active' ? 'accent' : data.status === 'achieved' ? 'ok' : 'neutral'}>{data.status}</StatusPill>
                  <ActionStateBadge state={data.actionState} />
                  {data.targetDate ? <span>target {formatLongDay(data.targetDate)}</span> : <span>undated</span>}
                </span>
              }
              title={data.title}
              subtitle={data.purpose}
              actions={
                <>
                  <Button icon="sparkle" onClick={() => setBreakingDown(true)}>
                    Break it down
                  </Button>
                  <Popover align="right" title="Status" trigger={(props) => <Button icon="chevron-down" {...props}>Change status</Button>}>
                    {(close) => (
                      <>
                        <MenuItem icon="play" disabled={data.status === 'active'} onClick={() => { close(); apply(() => setGoalStatus(data.id, 'active'), 'Goal active') }}>Active</MenuItem>
                        <MenuItem icon="pause" disabled={data.status === 'paused'} onClick={() => { close(); apply(() => setGoalStatus(data.id, 'paused'), 'Paused · no overdue work generated') }}>Paused</MenuItem>
                        <MenuItem icon="check" disabled={data.status === 'achieved'} onClick={() => { close(); setDeclaring(data) }}>Declare achieved…</MenuItem>
                        <MenuItem icon="trash" danger disabled={data.status === 'archived'} onClick={() => { close(); apply(() => setGoalStatus(data.id, 'archived'), 'Archived · not deleted') }}>Archive</MenuItem>
                      </>
                    )}
                  </Popover>
                </>
              }
            />
            <div className="k-grid k-grid--2">
              <div>
                <Panel flush>
                  <PanelHead title="Outcome" eyebrow="What would be true" />
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.4, letterSpacing: '-0.02em' }}>{data.outcome}</p>
                  <p className="muted small" style={{ marginTop: 10 }}>
                    Evidence definition: {data.evidenceDefinition || '—'}
                  </p>
                </Panel>
                <Panel>
                  <PanelHead title="Milestones" eyebrow="Ordered" meta={<StatusPill>{data.milestones.filter((m) => m.done).length}/{data.milestones.length}</StatusPill>} />
                  <MilestoneList milestones={data.milestones} onToggle={(milestoneId) => apply(() => toggleMilestone(data.id, milestoneId))} onAdd={(title) => apply(() => addMilestone(data.id, title), 'Milestone added')} />
                </Panel>
              </div>
              <div>
                <Panel flush>
                  <PanelHead title="Next actions" eyebrow="Owned by Tasks · linked here" />
                  <LinkedActionList actions={data.actions} onSetNext={(actionId) => apply(() => setNextAction(data.id, actionId), 'Next action selected')} />
                </Panel>
                <Panel>
                  <PanelHead title="Evidence" eyebrow="Collected vs declared" />
                  <EvidenceList evidence={data.evidence} />
                  {data.achievedDeclaredAt ? <p className="muted small" style={{ marginTop: 12 }}>Declared achieved {new Date(data.achievedDeclaredAt).toLocaleString()}.</p> : null}
                </Panel>
              </div>
            </div>
            <DeclareAchievedDialog goal={declaring} busy={busy} onClose={() => setDeclaring(null)} onConfirm={async () => { await apply(() => setGoalStatus(data.id, 'achieved'), 'Declared achieved'); setDeclaring(null) }} />
          </>
        )}
      </AsyncPanel>
      <BreakdownPanel open={breakingDown} state={breakdown.state} suggestions={breakdown.suggestions} onClose={() => setBreakingDown(false)} onRequest={breakdown.request} onAccept={acceptSuggestion} onReject={(suggestion) => breakdown.decide(suggestion.id, 'rejected')} />
    </div>
  )
}
