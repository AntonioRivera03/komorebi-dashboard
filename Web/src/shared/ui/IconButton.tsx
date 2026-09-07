import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Icon, type IconName } from './Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  active?: boolean
  size?: 'sm' | 'md'
}

export function IconButton({ icon, label, active, size = 'md', className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn('k-iconbtn', active && 'k-iconbtn--active', size === 'sm' && 'k-iconbtn--sm', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 13 : 15} />
    </button>
  )
}
