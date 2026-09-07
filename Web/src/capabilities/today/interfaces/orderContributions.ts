import type { TodayContribution, TodayLayout } from './types'

/**
 * Today's presentation ordering: urgent exceptions, next fixed commitment,
 * user-pinned items, then ordinary suggestions. Hard limit applied in code.
 */
export function orderContributions(contributions: TodayContribution[], layout: TodayLayout, limit: number, displayOnly: boolean): TodayContribution[] {
  const allowed = contributions.filter((item) => !layout.hidden.includes(item.kind)).filter((item) => !displayOnly || item.visibility === 'display')
  const rank = (item: TodayContribution) => {
    if (item.kind === 'exception') return 0
    if (item.kind === 'commitment') return 1
    if (layout.pinned.includes(item.key)) return 2
    return 3 + layout.order.indexOf(item.kind)
  }
  return [...allowed].sort((a, b) => rank(a) - rank(b) || b.priority - a.priority).slice(0, limit)
}
