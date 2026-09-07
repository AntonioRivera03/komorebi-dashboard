import { formatRelative } from '../../../shared/lib/format'
import type { Thread } from '../interfaces/types'
import styles from '../conversations.module.css'

type Props = { thread: Thread; active: boolean; onSelect: (id: string) => void }

export function ThreadListItem({ thread, active, onSelect }: Props) {
  return (
    <button type="button" className={styles.threadRow} aria-current={active} data-archived={thread.archived} onClick={() => onSelect(thread.id)}>
      <span>{thread.title}</span>
      <small>
        {thread.originCapability} · {thread.messageCount} messages · {formatRelative(thread.updatedAt)}
        {thread.archived ? ' · archived' : ''}
      </small>
    </button>
  )
}
