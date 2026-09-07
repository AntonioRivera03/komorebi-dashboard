import styles from '../briefings.module.css'

type Props = { budget: number; onChange: (budget: number) => void }

export function BudgetControl({ budget, onChange }: Props) {
  return (
    <div className={styles.budget}>
      <strong>{budget}</strong>
      <div style={{ flex: 1 }}>
        <span className="label">attention budget · items per digest</span>
        <input type="range" min={3} max={10} value={budget} onChange={(event) => onChange(Number(event.target.value))} aria-label="Digest size" />
      </div>
    </div>
  )
}
