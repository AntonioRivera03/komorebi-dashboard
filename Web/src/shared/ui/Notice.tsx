import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type Props = { tone?: 'neutral' | 'warn' | 'ok' | 'danger'; glyph?: string; children: ReactNode }

export function Notice({ tone = 'neutral', glyph = '※', children }: Props) {
  return (
    <div className={cn('k-notice', tone !== 'neutral' && `k-notice--${tone}`)} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="k-notice__icon" aria-hidden="true">
        {glyph}
      </span>
      <div>{children}</div>
    </div>
  )
}
