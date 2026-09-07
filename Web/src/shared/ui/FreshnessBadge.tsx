import type { Freshness } from '../contracts/common'
import { cn } from '../lib/cn'
import { formatRelative } from '../lib/format'
import { useNow } from '../hooks/useNow'

type Props = { freshness: Freshness; observedAt: string; prefix?: string }

export function FreshnessBadge({ freshness, observedAt, prefix = 'observed' }: Props) {
  const now = useNow()
  const text = freshness === 'unknown' ? 'unknown state' : `${prefix} ${formatRelative(observedAt, now.getTime())}`
  return (
    <span className={cn('k-fresh', freshness !== 'current' && `k-fresh--${freshness}`)} title={new Date(observedAt).toLocaleString()}>
      <span className={cn('k-dot', freshness === 'stale' && 'k-dot--warn', freshness === 'unknown' && 'k-dot--danger')} style={{ width: 5, height: 5, boxShadow: 'none', animation: 'none' }} />
      {freshness === 'stale' ? 'stale · ' : ''}
      {text}
    </span>
  )
}
