import type { ReactNode } from 'react'

type Props = { value: ReactNode; unit?: string; label: string }

export function StatTile({ value, unit, label }: Props) {
  return (
    <div className="k-stat">
      <strong>
        {value}
        {unit ? <small>{unit}</small> : null}
      </strong>
      <span>{label}</span>
    </div>
  )
}
