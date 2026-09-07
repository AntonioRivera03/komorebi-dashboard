import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { usePlanningSession } from '../interfaces/usePlanningSession'
import type { PlanningInput } from '../interfaces/types'
import { BudgetBar } from '../components/BudgetBar'
import { CandidateRow } from '../components/CandidateRow'
import { CapacityInputs } from '../components/CapacityInputs'
import styles from '../capacity.module.css'

export default function PlanPage() {
  const [input, setInput] = useState<PlanningInput>({ availableMinutes: 90, effort: 'any', includeLearning: true, includeAdmin: true })
  const planning = usePlanningSession()
  const toast = useToast()
  const session = planning.session
  const used = session?.candidates.filter((item) => item.decision !== 'dismissed').reduce((sum, item) => sum + item.minutes, 0) ?? 0

  return (
    <div className="k-page">
      <PageHeader eyebrow="Planning · P05 · undecided" title="Plan the day you actually have" subtitle="Choose available time and energy; get a smaller, feasible set of options. The proposed total never exceeds your budget." actions={<StatusPill tone="warn">undecided capability · interface boundary only</StatusPill>} />
      <div className="k-grid k-grid--sidebar" style={{ gridTemplateColumns: '340px 1fr' }}>
        <CapacityInputs input={input} onChange={setInput} onPlan={() => planning.plan(input)} loading={planning.loading} />
        <Panel flush>
          <PanelHead title="Feasible set" eyebrow={session ? `Session ${session.id} · calendar ${session.calendarFreshness}` : 'No session yet'} meta={session ? <StatusPill>{session.candidates.length} candidates</StatusPill> : null} />
          {!session ? (
            <EmptyState glyph="◔" title="Tell me how much time you have">
              Candidates come from Tasks, Study and Reviews through their public queries. Selection is deterministic: exclude blocked items, fit the budget with buffers, order by priority and deadline. AI only explains.
            </EmptyState>
          ) : (
            <>
              <BudgetBar total={session.input.availableMinutes} used={used} buffer={session.bufferMinutes} />
              <div style={{ marginTop: 18 }}>
                {session.candidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    onDecide={(id, decision) => {
                      planning.decide(id, decision)
                      if (decision === 'scheduled') toast('Asked Calendar for a proposed block · revalidated on acceptance')
                      if (decision === 'dismissed') toast('Dismissed · nothing added to tomorrow')
                    }}
                  />
                ))}
              </div>
              {session.calendarFreshness === 'stale' ? <Notice tone="warn" glyph="!">Calendar data is stale; slots are not claimed conflict-free.</Notice> : null}
              {session.excluded.length ? (
                <div style={{ marginTop: 20 }}>
                  <span className="label">Left out, and why</span>
                  <div style={{ marginTop: 8 }}>
                    {session.excluded.map((item) => (
                      <div key={item.title} className={styles.excluded}>
                        <span>{item.title}</span>
                        <span className="mono">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
