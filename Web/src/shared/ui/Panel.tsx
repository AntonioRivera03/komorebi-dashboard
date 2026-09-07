import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

type Props = HTMLAttributes<HTMLElement> & {
  variant?: 'open' | 'filled' | 'card'
  flush?: boolean
  as?: 'section' | 'article' | 'div'
  children: ReactNode
}

export function Panel({ variant = 'open', flush, as: Tag = 'section', className, children, ...rest }: Props) {
  return (
    <Tag className={cn('k-panel', variant === 'filled' && 'k-panel--filled', variant === 'card' && 'k-panel--card', flush && 'k-panel--flush', className)} {...rest}>
      {children}
    </Tag>
  )
}
