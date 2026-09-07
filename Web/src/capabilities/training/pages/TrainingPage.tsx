import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { StatTile } from '../../../shared/ui/StatTile'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { daysUntil, formatLongDay, formatRelative } from '../../../shared/lib/format'
import { useTrainingSummary } from '../interfaces/useTrainingSummary'
import { recordWorkout, reviseFuturePlan } from '../interfaces/trainingApi'
import type { PlannedWorkout } from '../interfaces/types'
import { LogWorkoutDialog } from '../components/LogWorkoutDialog'
import { WorkoutRow } from '../components/WorkoutRow'
import styles from '../training.module.css'

export default function TrainingPage() {
  const plan = useTrainingSummary()
  const toast = useToast()
  const [logging, setLogging] = useState<PlannedWorkout | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="k-page">
      <PageHeader eyebrow="Training · M01 · undecided" title="Running" subtitle="Your 5K and 10K intentions, an honest baseline and a plan you chose. No generated progression, no readiness scores." actions={<StatusPill tone="warn">undecided · manual plan and logs</StatusPill>} />
      <AsyncPanel query={plan} skeletonLines={8}>
        {({ data }) => (
          <div className="k-grid k-grid--2">
            <Panel flush>
              <PanelHead title={data.name} eyebrow={`${data.target} · ${data.weeks} weeks`} meta={<StatusPill>{daysUntil(data.targetDate)} days to {formatLongDay(data.targetDate)}</StatusPill>} />
              {[...data.workouts]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((workout) => (
                  <WorkoutRow
                    key={workout.id}
                    workout={workout}
                    onLog={setLogging}
                    onMove={async (item) => {
                      const next = new Date(item.date)
                      next.setDate(next.getDate() + 1)
                      const result = await reviseFuturePlan(item.id, next.toISOString())
                      if (result.status === 'completed') {
                        plan.mutate(() => result.value)
                        toast('Moved one day · the original plan and history are kept')
                      }
                    }}
                  />
                ))}
            </Panel>
            <div>
              <div className={styles.baseline}>
                <span className="label">Baseline · user-entered</span>
                {data.baseline ? (
                  <>
                    <strong>
                      {data.baseline.km} km · {data.baseline.minutes} min
                    </strong>
                    <span className="muted small">entered {formatRelative(data.baseline.at)} · a progression is only “personalised” once a baseline exists</span>
                  </>
                ) : (
                  <span className="muted small">Unknown baseline: no personalised progression will be presented as validated.</span>
                )}
              </div>
              <div className="k-stats" style={{ marginTop: 8 }}>
                <StatTile value={data.workouts.filter((item) => item.status === 'done').length} label="completed" />
                <StatTile value={data.workouts.filter((item) => item.status === 'missed').length} label="missed · not rolled forward" />
                <StatTile value={data.workouts.filter((item) => item.status === 'planned' || item.status === 'moved').length} label="upcoming" />
              </div>
              <div className="k-stack" style={{ marginTop: 16 }}>
                <Notice glyph="⚙">Completing an activity is distinct from achieving the running goal. Goals can link this plan as evidence; the declaration stays yours.</Notice>
                <Notice glyph="✦">AI may organise a plan you selected or summarise logs with clear source context. It never escalates mileage.</Notice>
              </div>
            </div>
          </div>
        )}
      </AsyncPanel>
      <LogWorkoutDialog
        workout={logging}
        busy={busy}
        onClose={() => setLogging(null)}
        onSave={async (workout, log) => {
          setBusy(true)
          const result = await recordWorkout(workout.id, log)
          setBusy(false)
          if (result.status === 'completed') {
            plan.mutate(() => result.value)
            setLogging(null)
            toast('Workout logged')
          }
        }}
      />
    </div>
  )
}
