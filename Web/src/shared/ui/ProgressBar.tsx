import { cn } from '../lib/cn'

type Props = {
  value: number
  max?: number
  tone?: 'accent' | 'warn' | 'muted'
  label?: string
  captionLeft?: string
  captionRight?: string
}

export function ProgressBar({ value, max = 100, tone = 'accent', label, captionLeft, captionRight }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className={cn('k-progress', tone !== 'accent' && `k-progress--${tone}`)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {captionLeft || captionRight ? (
        <div className="k-progress-caption">
          <span>{captionLeft}</span>
          <span>{captionRight}</span>
        </div>
      ) : null}
    </div>
  )
}
