import type { TodayContribution, TodayLayout } from '../interfaces/types'
import { orderContributions } from '../interfaces/orderContributions'
import { ContributionCard } from './ContributionCard'
import styles from '../today.module.css'

type Props = {
  contributions: TodayContribution[]
  layout: TodayLayout
  limit: number
  displayOnly: boolean
  onPin: (key: string, pinned: boolean) => void
  onDismiss: (key: string, period: 'hour' | 'today' | 'week') => void
}

export function ContributionGrid({ contributions, layout, limit, displayOnly, onPin, onDismiss }: Props) {
  const ordered = orderContributions(contributions, layout, limit, displayOnly)
  return (
    <div className={styles.cards}>
      {ordered.map((item) => (
        <ContributionCard key={item.key} contribution={item} pinned={layout.pinned.includes(item.key)} onPin={onPin} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
