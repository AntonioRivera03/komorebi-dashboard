import type { SelectHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Option = { value: string; label: string; disabled?: boolean }

type Props = SelectHTMLAttributes<HTMLSelectElement> & { options: Option[] }

export function Select({ options, className, ...rest }: Props) {
  return (
    <select className={cn('k-select', className)} {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
