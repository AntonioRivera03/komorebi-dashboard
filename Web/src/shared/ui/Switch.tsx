import { cn } from '../lib/cn'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  pending?: boolean
}

export function Switch({ checked, onChange, label, disabled, pending }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn('k-switch', pending && 'k-switch--pending')}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  )
}
