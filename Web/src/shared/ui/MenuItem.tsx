import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Icon, type IconName } from './Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName
  hint?: string
  description?: string
  danger?: boolean
  children: ReactNode
}

export function MenuItem({ icon, hint, description, danger, className, children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={cn('k-menu-item', danger && 'k-menu-item--danger', className)} role="menuitem" {...rest}>
      {icon ? <Icon name={icon} size={13} /> : null}
      <span>
        {children}
        {description ? <span className="k-menu-item__desc">{description}</span> : null}
      </span>
      {hint ? <span className="k-menu-item__hint">{hint}</span> : null}
    </button>
  )
}
