import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { routes } from '../../../shared/lib/routes'
import { useGoals } from '../interfaces/useGoals'
import type { GoalStatus } from '../interfaces/types'
import { GoalCard } from '../components/GoalCard'
import { GoalComposerDialog } from '../components/GoalComposerDialog'
import styles from '../goals.module.css'

export default function GoalsPage() {
  const goals = useGoals()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<GoalStatus | 'all'>('active')
  const [composing, setComposing] = useState(false)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Planning · P02"
        title="Goals"
        subtitle="Connect a reason to an outcome, a milestone and a practical next action. Evidence is collected; achievement is declared."
        actions={
          <>
            <SegmentedControl label="Status" value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'achieved', label: 'Achieved' }, { value: 'all', label: 'All' }]} />
            <Button variant="primary" icon="plus" onClick={() => setComposing(true)}>
              New goal
            </Button>
          </>
        }
      />
      <AsyncPanel query={goals} isEmpty={(data) => data.filter((goal) => filter === 'all' || goal.status === filter).length === 0} empty={<EmptyState glyph="◎" title="No goals here">Goals are outcomes with a reason. Tasks live in Tasks; goals only link to them.</EmptyState>} skeletonLines={6}>
        {({ data }) => (
          <div className={styles.grid}>
            {data
              .filter((goal) => filter === 'all' || goal.status === filter)
              .map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
          </div>
        )}
      </AsyncPanel>
      <GoalComposerDialog open={composing} onClose={() => setComposing(false)} onCreated={(goal) => navigate(`${routes.goals}/${goal.id}`)} />
    </div>
  )
}
