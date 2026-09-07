import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { TextInput } from '../../../shared/ui/TextInput'
import { Switch } from '../../../shared/ui/Switch'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Dialog } from '../../../shared/ui/Dialog'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useThreads } from '../interfaces/useThreads'
import { useThread } from '../interfaces/useThread'
import { archiveThread, deleteThread, reviseMessage } from '../interfaces/conversationsApi'
import { ThreadListItem } from '../components/ThreadListItem'
import { ThreadMessageView } from '../components/ThreadMessageView'
import styles from '../conversations.module.css'

export default function ConversationsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [committed, setCommitted] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const threads = useThreads(committed, includeArchived)
  const thread = useThread(id)

  useEffect(() => {
    if (!id && threads.status === 'ready' && threads.snapshot.data[0]) navigate(`${routes.conversations}/${threads.snapshot.data[0].id}`, { replace: true })
  }, [id, threads, navigate])

  return (
    <div className="k-page">
      <PageHeader eyebrow="Conversations · E02" title="Every conversation, kept" subtitle="Assistant and feature chats share one canonical record: messages, revisions, context manifests and run references. No 24-hour expiry." />
      <div className={styles.layout}>
        <aside>
          <form
            className="k-row"
            style={{ marginBottom: 10 }}
            onSubmit={(event) => {
              event.preventDefault()
              setCommitted(query)
            }}
          >
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search threads" aria-label="Search threads" style={{ flex: 1 }} />
          </form>
          <div className="k-row k-row--between" style={{ marginBottom: 8, fontSize: 11 }}>
            <span className="muted">Include archived</span>
            <Switch label="Include archived" checked={includeArchived} onChange={setIncludeArchived} />
          </div>
          <AsyncPanel query={threads} skeletonLines={4}>
            {({ data }) => (
              <div className="k-stack" style={{ gap: 2 }}>
                {data.map((item) => (
                  <ThreadListItem key={item.id} thread={item} active={item.id === id} onSelect={(next) => navigate(`${routes.conversations}/${next}`)} />
                ))}
              </div>
            )}
          </AsyncPanel>
        </aside>
        <section>
          {!id ? (
            <EmptyState glyph="◌" title="Pick a thread">Feature pages link here rather than keeping private chat stores.</EmptyState>
          ) : (
            <AsyncPanel query={thread} skeletonLines={8}>
              {({ data }) => (
                <>
                  <div className="k-row k-row--between" style={{ marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 26 }}>{data.thread.title}</h2>
                      <div className="k-row" style={{ marginTop: 6 }}>
                        <StatusPill tone="soft">{data.thread.originCapability}</StatusPill>
                        {data.thread.archived ? <StatusPill>archived</StatusPill> : null}
                        {data.thread.contextRefs.map((ref) => (
                          <span key={ref} className="k-ref">
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="k-row">
                      {data.thread.originCapability === 'assistant' ? (
                        <Button size="sm" onClick={() => navigate(routes.assistant)}>
                          Continue
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const result = await archiveThread(data.thread.id, !data.thread.archived)
                          if (result.status === 'completed') {
                            thread.mutate((current) => ({ ...current, thread: result.value }))
                            threads.reload()
                          }
                        }}
                      >
                        {data.thread.archived ? 'Unarchive' : 'Archive'}
                      </Button>
                      <Button size="sm" variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  {data.thread.summary ? (
                    <div className={styles.summary}>
                      <span className="label">AI summary · v{data.thread.summary.version} · full messages preserved</span>
                      <p style={{ marginTop: 6 }}>{data.thread.summary.text}</p>
                    </div>
                  ) : null}
                  <div style={{ marginTop: 12 }}>
                    {data.messages.map((message) => (
                      <ThreadMessageView
                        key={message.id}
                        message={message}
                        onRevise={async (item, text) => {
                          const result = await reviseMessage(data.thread.id, item.id, text)
                          if (result.status === 'completed') {
                            thread.mutate((current) => ({ ...current, messages: current.messages.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                            toast('Correction stored as a revision · later answers can cite it')
                          }
                        }}
                      />
                    ))}
                  </div>
                  <Dialog
                    open={confirmDelete}
                    onClose={() => setConfirmDelete(false)}
                    eyebrow="Explicit deletion"
                    title="Delete this thread?"
                    footer={
                      <>
                        <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                          Keep
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            await deleteThread(data.thread.id)
                            setConfirmDelete(false)
                            toast('Thread deleted · derived memory invalidated')
                            navigate(routes.conversations)
                            threads.reload()
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    }
                  >
                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>Messages, revisions and run references are removed. Memory items that depended on this evidence become ineligible for retrieval and are re-derived or purged.</p>
                  </Dialog>
                </>
              )}
            </AsyncPanel>
          )}
        </section>
      </div>
    </div>
  )
}
