import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { ProgressBar } from '../../../shared/ui/ProgressBar'
import { TextInput } from '../../../shared/ui/TextInput'
import { formatMoney, formatRelative } from '../../../shared/lib/format'
import type { SavingsTarget } from '../interfaces/types'
import styles from '../finance.module.css'

type Props = { target: SavingsTarget; onBalance: (target: SavingsTarget, minor: number) => void }

export function SavingsCard({ target, onBalance }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState((target.balance.minor / 100).toFixed(2))
  return (
    <div className={styles.saving}>
      <span className="label">{target.name}</span>
      <strong>{formatMoney(target.balance.minor, target.balance.currency)}</strong>
      <ProgressBar value={target.balance.minor} max={target.target.minor} label={target.name} captionLeft={`of ${formatMoney(target.target.minor, target.target.currency)}`} captionRight={`entered ${formatRelative(target.balanceEnteredAt)} · not live`} />
      {editing ? (
        <div className="k-row">
          <TextInput type="number" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} aria-label="Balance" style={{ flex: 1 }} />
          <Button size="sm" variant="primary" onClick={() => { onBalance(target, Math.round(Number(value) * 100)); setEditing(false) }}>
            Save
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Record balance
        </Button>
      )}
    </div>
  )
}
