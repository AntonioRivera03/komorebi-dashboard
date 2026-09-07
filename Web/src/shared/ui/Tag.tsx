import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type Props = {
  children: ReactNode
  outline?: boolean
  onRemove?: () => void
}

export function Tag({ children, outline, onRemove }: Props) {
  return (
    <span className={cn('k-tag', outline && 'k-tag--outline')}>
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label="Remove">
          ×
        </button>
      ) : null}
    </span>
  )
}
