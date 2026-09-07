import type { AiCost } from '../interfaces/types'
import styles from '../usage.module.css'

export function AiCostTable({ ai }: { ai: AiCost[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>capability</th>
          <th style={{ textAlign: 'right' }}>requests</th>
          <th style={{ textAlign: 'right' }}>tokens in/out</th>
          <th style={{ textAlign: 'right' }}>est. cost</th>
          <th style={{ textAlign: 'right' }}>useful outcomes</th>
        </tr>
      </thead>
      <tbody>
        {ai.map((row) => (
          <tr key={row.capability}>
            <td>{row.capability}</td>
            <td className={styles.num}>{row.requests}</td>
            <td className={styles.num}>
              {(row.tokensIn / 1000).toFixed(0)}k / {(row.tokensOut / 1000).toFixed(0)}k
            </td>
            <td className={styles.num}>€{(row.estimatedCents / 100).toFixed(2)}</td>
            <td className={styles.num}>
              {row.usefulOutcomes}/{row.requests}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
