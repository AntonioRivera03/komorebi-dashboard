import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { ProgressBar } from '../../../shared/ui/ProgressBar'
import { daysUntil } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import type { Goal } from '../interfaces/types'
import { ActionStateBadge } from './ActionStateBadge'
import styles from '../goals.module.css'

export function GoalCard({ goal }: { goal: Goal }) {
  const done = goal.milestones.filter((item) => item.done).length
  const next = goal.actions.find((item) => item.isNext)
  const days = goal.targetDate ? daysUntil(goal.targetDate) : null
  return (
    <Link to={`${routes.goals}/${goal.id}`} className={styles.card} data-status={goal.status}>
      <div className={styles.statusStrip}>
        <StatusPill tone={goal.status === 'active' ? 'accent' : goal.status === 'achieved' ? 'ok' : 'neutral'}>{goal.status}</StatusPill>
        <ActionStateBadge state={goal.actionState} />
        {days !== null ? <span className="muted small mono">{days < 0 ? `${-days}d past target` : `${days}d to target`}</span> : <span className="muted small mono">undated · exploration</span>}
      </div>
      <h3 className={styles.cardTitle}>{goal.title}</h3>
      <p className={styles.purpose}>{goal.purpose}</p>
      {goal.milestones.length ? <ProgressBar value={done} max={goal.milestones.length} label="Milestones" captionLeft={`${done}/${goal.milestones.length} milestones`} captionRight={goal.evidence.length ? `${goal.evidence.length} evidence` : 'no evidence yet'} /> : null}
      {next ? (
        <div className={styles.next}>
          <b>next</b>
          <span>{next.title}</span>
        </div>
      ) : null}
    </Link>
  )
}
