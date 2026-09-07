import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & { round?: boolean }

export function Checkbox({ round, className, ...rest }: Props) {
  return <input type="checkbox" className={cn('k-check', round && 'k-check--round', className)} {...rest} />
}
