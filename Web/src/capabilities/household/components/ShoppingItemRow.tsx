import { Checkbox } from '../../../shared/ui/Checkbox'
import type { ShoppingItem } from '../interfaces/types'
import styles from '../household.module.css'

type Props = { item: ShoppingItem; onToggle: (item: ShoppingItem) => void; onRepeat: (item: ShoppingItem) => void }

export function ShoppingItemRow({ item, onToggle, onRepeat }: Props) {
  return (
    <div className={styles.item} data-purchased={item.purchased}>
      <Checkbox checked={item.purchased} onChange={() => onToggle(item)} aria-label={`${item.purchased ? 'Restore' : 'Purchased'} ${item.name}`} />
      <span>
        {item.name}
        <small>
          × {item.quantity} · via {item.addedVia} · r{item.revision}
        </small>
      </span>
      <button type="button" className={styles.repeatBtn} aria-pressed={item.repeat} onClick={() => onRepeat(item)} title={item.repeat ? 'Repeats · click to stop' : 'Mark as a frequently used item'} aria-label="Toggle repeat">
        ↻
      </button>
    </div>
  )
}
