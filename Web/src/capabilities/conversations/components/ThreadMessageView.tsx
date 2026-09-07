import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { TextArea } from '../../../shared/ui/TextArea'
import { formatRelative } from '../../../shared/lib/format'
import type { ThreadMessage } from '../interfaces/types'
import styles from '../conversations.module.css'

type Props = { message: ThreadMessage; onRevise: (message: ThreadMessage, text: string) => void }

export function ThreadMessageView({ message, onRevise }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(message.text)
  return (
    <div className={styles.message}>
      <div className={styles.role}>
        <b>{message.role}</b>
        {formatRelative(message.at)}
      </div>
      <div>
        {editing ? (
          <div className="k-stack">
            <TextArea rows={3} value={text} onChange={(event) => setText(event.target.value)} aria-label="Corrected message" />
            <div className="k-row">
              <Button size="sm" variant="primary" onClick={() => { onRevise(message, text); setEditing(false) }}>
                Save as revision {message.revisions.length + 2}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className={styles.text} data-role={message.role}>
            {message.text || <span className="muted">(no output)</span>}
          </p>
        )}
        <div className="k-row" style={{ marginTop: 6 }}>
          {message.status !== 'completed' ? <StatusPill tone={message.status === 'interrupted' ? 'warn' : 'danger'}>{message.status.replace('_', ' ')}</StatusPill> : null}
          {message.role === 'user' && !editing ? (
            <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(true)}>
              Correct
            </Button>
          ) : null}
        </div>
        {message.revisions.map((revision) => (
          <div key={revision.revision} className={styles.revision}>
            r{revision.revision} · {formatRelative(revision.at)}: “{revision.text}”
          </div>
        ))}
        {message.run ? (
          <div className={styles.run}>
            <span>{message.run.model}</span>
            <span>{message.run.promptTemplate}</span>
            <span>{message.run.latencyMs} ms</span>
            <span>
              {message.run.tokensIn}→{message.run.tokensOut} tok
            </span>
            {message.run.tools.map((tool) => (
              <span key={tool}>tool {tool}</span>
            ))}
            {message.run.contextRefs.map((ref) => (
              <span key={ref}>ctx {ref}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
