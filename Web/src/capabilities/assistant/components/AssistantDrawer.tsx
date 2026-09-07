import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { Button } from '../../../shared/ui/Button'
import { useShellOverlay } from '../../../app/providers/useShellOverlay'
import { routes } from '../../../shared/lib/routes'
import { createThread } from '../interfaces/assistantApi'
import { useChat } from '../interfaces/useChat'
import { ChatComposer } from './ChatComposer'
import { ChatThread } from './ChatThread'

/** Shell-level assistant drawer (I03). Threads persist through Conversations; A toggles it anywhere. */
export function AssistantDrawer() {
  const { overlay, close } = useShellOverlay()
  const open = overlay === 'assistant'
  const [threadId, setThreadId] = useState<string | null>(null)
  const chat = useChat(threadId)

  useEffect(() => {
    if (open && !threadId) createThread('Quick question').then((thread) => setThreadId(thread.id))
  }, [open, threadId])

  return (
    <SidePanel
      open={open}
      onClose={close}
      eyebrow="Assistant · shows its work"
      title="Ask"
      wide
      headerExtra={
        <div className="k-row" style={{ marginTop: 6 }}>
          <Link to={routes.assistant} onClick={close} className="k-ref">
            full workspace →
          </Link>
          <Button size="sm" variant="ghost" onClick={() => createThread('Quick question').then((thread) => setThreadId(thread.id))}>
            New thread
          </Button>
        </div>
      }
      footer={
        <div style={{ width: '100%' }}>
          <ChatComposer onSend={chat.send} disabled={!threadId || chat.sending} autoFocus suggestions={['What did I find confusing last week?', 'Schedule 40 minutes tomorrow evening', 'Set the living room to evening']} />
        </div>
      }
    >
      <ChatThread messages={chat.messages} loading={chat.loading} sending={chat.sending} onReplace={chat.replaceMessage} />
    </SidePanel>
  )
}
