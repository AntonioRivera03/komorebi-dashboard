import type { Prompt, SessionItem } from '../interfaces/types'
import styles from '../study.module.css'

type Props = { items: SessionItem[]; prompts: Prompt[]; activeId: string; onSelect: (promptId: string) => void }

export function SessionItemList({ items, prompts, activeId, onSelect }: Props) {
  return (
    <div className={styles.itemList}>
      {items.map((item, index) => {
        const prompt = prompts.find((entry) => entry.id === item.promptId)
        return (
          <button key={item.promptId} type="button" className={styles.itemBtn} aria-current={item.promptId === activeId} onClick={() => onSelect(item.promptId)}>
            <i data-done={item.attemptIds.length > 0}>{item.attemptIds.length > 0 ? '✓' : index + 1}</i>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prompt?.question ?? item.promptId}</span>
            <span className="mono small muted">r{item.promptRevision}</span>
          </button>
        )
      })}
    </div>
  )
}
