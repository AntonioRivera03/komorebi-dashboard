import { formatRelative } from '../../../shared/lib/format'
import type { ThreadSummary } from '../interfaces/types'
import styles from '../assistant.module.css'

type Props = { threads: ThreadSummary[]; activeId: string | null; onSelect: (id: string) => void }

export function ThreadList({ threads, activeId, onSelect }: Props) {
  return (
    <>
      {threads.map((thread) => (
        <button key={thread.id} type="button" className={styles.threadBtn} aria-current={thread.id === activeId} onClick={() => onSelect(thread.id)}>
          <span>{thread.title}</span>
          <small>
            {thread.originCapability} · {thread.messageCount} msgs · {formatRelative(thread.updatedAt)}
          </small>
        </button>
      ))}
    </>
  )
}
