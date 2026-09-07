import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type Props = { children: ReactNode; accent?: boolean; className?: string }

export function Eyebrow({ children, accent, className }: Props) {
  return (
    <span className={cn('label', className)} style={accent ? { color: 'var(--accent)' } : undefined}>
      {children}
    </span>
  )
}
