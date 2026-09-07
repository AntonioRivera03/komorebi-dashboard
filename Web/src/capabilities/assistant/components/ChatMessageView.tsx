import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { ChatMessage } from '../interfaces/types'
import { EvidenceChip } from './EvidenceChip'
import { ProposalCard } from './ProposalCard'
import { ToolCallList } from './ToolCallList'
import styles from '../assistant.module.css'

type Props = { message: ChatMessage; onReplace: (message: ChatMessage) => void }

export function ChatMessageView({ message, onReplace }: Props) {
  return (
    <div className={styles.message} data-role={message.role}>
      {message.text ? <div className={styles.bubble}>{message.text}</div> : null}
      {message.runState && message.runState !== 'completed' ? (
        <StatusPill tone={message.runState === 'interrupted' ? 'warn' : 'danger'}>{message.runState.replace('_', ' ')}</StatusPill>
      ) : null}
      {message.limitation ? <p className="muted small">{message.limitation}</p> : null}
      {message.toolCalls?.length ? <ToolCallList toolCalls={message.toolCalls} /> : null}
      {message.evidence?.length ? (
        <div className={styles.evidence}>
          {message.evidence.map((evidence) => (
            <EvidenceChip key={evidence.id} evidence={evidence} />
          ))}
        </div>
      ) : null}
      {message.proposal ? <ProposalCard proposal={message.proposal} onChange={(proposal) => onReplace({ ...message, proposal })} /> : null}
      <span className={styles.stamp}>
        {message.role === 'user' ? 'you' : message.role}
        {message.originCapability ? ` · via ${message.originCapability}` : ''} · {formatRelative(message.at)}
      </span>
    </div>
  )
}
