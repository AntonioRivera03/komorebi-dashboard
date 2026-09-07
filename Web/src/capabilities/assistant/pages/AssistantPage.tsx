import { useEffect, useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { createThread } from '../interfaces/assistantApi'
import { useThreads } from '../interfaces/useThreads'
import { useChat } from '../interfaces/useChat'
import { ChatComposer } from '../components/ChatComposer'
import { ChatThread } from '../components/ChatThread'
import { ThreadList } from '../components/ThreadList'
import { ToolRegistryPanel } from '../components/ToolRegistryPanel'
import styles from '../assistant.module.css'

export default function AssistantPage() {
  const threads = useThreads()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const chat = useChat(activeId)

  useEffect(() => {
    if (!activeId && threads.status === 'ready' && threads.snapshot.data[0]) setActiveId(threads.snapshot.data[0].id)
  }, [threads, activeId])

  const newThread = async () => {
    const thread = await createThread('New question')
    threads.reload()
    setActiveId(thread.id)
  }

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Assistance · I03"
        title="Assistant"
        subtitle="Ask questions across your own material and preview proposed changes. Every answer links to evidence; every action is confirmed at its owner."
        actions={
          <>
            <Button icon="shield" onClick={() => setToolsOpen(true)}>
              Registered tools
            </Button>
            <Button variant="primary" icon="plus" onClick={newThread}>
              New thread
            </Button>
          </>
        }
      />
      <div className={styles.page}>
        <aside className={styles.threads} aria-label="Threads">
          <AsyncPanel query={threads} skeletonLines={4}>
            {({ data }) => <ThreadList threads={data} activeId={activeId} onSelect={setActiveId} />}
          </AsyncPanel>
        </aside>
        <section className={styles.chat}>
          <ChatThread messages={chat.messages} loading={chat.loading} sending={chat.sending} onReplace={chat.replaceMessage} />
          <ChatComposer onSend={chat.send} disabled={!activeId || chat.sending} suggestions={['What did I find confusing last week?', 'Schedule 40 minutes tomorrow evening', 'Remember to buy a new kettle']} />
        </section>
      </div>
      <ToolRegistryPanel open={toolsOpen} onClose={() => setToolsOpen(false)} />
    </div>
  )
}
