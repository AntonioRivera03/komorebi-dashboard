import { useEffect, useRef } from 'react'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { EmptyState } from '../../../shared/ui/EmptyState'
import type { ChatMessage } from '../interfaces/types'
import { ChatMessageView } from './ChatMessageView'
import styles from '../assistant.module.css'

type Props = { messages: ChatMessage[]; loading: boolean; sending: boolean; onReplace: (message: ChatMessage) => void }

export function ChatThread({ messages, loading, sending, onReplace }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, sending])

  if (loading) return <Skeleton lines={5} widths={['60%', '85%', '40%', '90%', '50%']} />
  return (
    <div className={styles.scroller}>
      <div className={styles.thread}>
        {messages.length === 0 && !sending ? (
          <EmptyState glyph="☼" title="Ask something you actually wrote down">
            Answers cite accessible notes, attempts and commitments. When there is no evidence, you get a limitation, not a guess.
          </EmptyState>
        ) : null}
        {messages.map((message) => (
          <ChatMessageView key={message.id} message={message} onReplace={onReplace} />
        ))}
        {sending ? (
          <div className={styles.message} data-role="assistant">
            <div className={styles.thinking} aria-label="Assistant is working">
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </div>
  )
}
