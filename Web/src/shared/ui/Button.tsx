import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Icon, type IconName } from './Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'soft' | 'danger'
  size?: 'sm' | 'md'
  block?: boolean
  busy?: boolean
  icon?: IconName
  children?: ReactNode
}

export function Button({ variant = 'outline', size = 'md', block, busy, icon, className, children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn('k-btn', variant !== 'outline' && `k-btn--${variant}`, size === 'sm' && 'k-btn--sm', block && 'k-btn--block', className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? <span className="k-btn__spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </button>
  )
}
