import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }

export function TextInput({ mono, className, ...rest }: Props) {
  return <input className={cn('k-input', mono && 'k-input--mono', className)} {...rest} />
}
