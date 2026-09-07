import type { SuggestionStats } from '../interfaces/types'
import styles from '../usage.module.css'

/** Presented, opened, accepted and edited are distinguishable, as the spec requires. */
export function SuggestionTable({ suggestions }: { suggestions: SuggestionStats[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>suggestion</th>
          <th style={{ textAlign: 'right' }}>presented</th>
          <th style={{ textAlign: 'right' }}>opened</th>
          <th style={{ textAlign: 'right' }}>accepted</th>
          <th style={{ textAlign: 'right' }}>edited</th>
          <th style={{ textAlign: 'right' }}>dismissed</th>
        </tr>
      </thead>
      <tbody>
        {suggestions.map((row) => (
          <tr key={row.kind}>
            <td>{row.kind}</td>
            <td className={styles.num}>{row.presented}</td>
            <td className={styles.num}>{row.opened}</td>
            <td className={styles.num}>{row.accepted}</td>
            <td className={styles.num}>{row.edited}</td>
            <td className={styles.num}>{row.dismissed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
