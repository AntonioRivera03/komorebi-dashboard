import type { ChatMessage } from '../interfaces/types'
import styles from '../assistant.module.css'

export function ToolCallList({ toolCalls }: { toolCalls: NonNullable<ChatMessage['toolCalls']> }) {
  return (
    <div className={styles.toolcalls} aria-label="Tool calls">
      {toolCalls.map((call, index) => (
        <span key={index} className={styles.toolcall} data-write={call.classification === 'write'} title={call.summary}>
          {call.tool} · {call.summary}
        </span>
      ))}
    </div>
  )
}
