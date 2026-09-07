import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type PillTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'soft'

type Props = {
  tone?: PillTone
  live?: boolean
  dot?: boolean
  children: ReactNode
  title?: string
  className?: string
}

export function StatusPill({ tone = 'neutral', live, dot, children, title, className }: Props) {
  return (
    <span className={cn('k-pill', tone !== 'neutral' && `k-pill--${tone}`, className)} title={title}>
      {dot || live ? <span className={cn('k-pill__dot', live && 'k-pill__dot--live')} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
