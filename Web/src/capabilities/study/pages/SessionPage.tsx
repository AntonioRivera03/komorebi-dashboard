import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { useShellOverlay } from '../../../app/providers/useShellOverlay'
import { routes } from '../../../shared/lib/routes'
import { newId } from '../../../shared/api/mock'
import { useStudySession } from '../interfaces/useSession'
import { endSession, pauseSession, recordAttempt, recordSelfAssessment, requestAiFeedback } from '../interfaces/studyApi'
import type { Assistance } from '../interfaces/types'
import { CheckpointPanel } from '../components/CheckpointPanel'
import { FocusTimer } from '../components/FocusTimer'
import { PromptWorkspace } from '../components/PromptWorkspace'
import { SessionItemList } from '../components/SessionItemList'
import styles from '../study.module.css'

export default function SessionPage() {
  const { id } = useParams()
  const session = useStudySession(id)
  const toast = useToast()
  const overlay = useShellOverlay()
  const [activeId, setActiveId] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [checkpointOpen, setCheckpointOpen] = useState(false)

  useEffect(() => {
    if (session.status === 'ready' && !activeId) {
      const firstOpen = session.snapshot.data.session.items.find((item) => item.attemptIds.length === 0) ?? session.snapshot.data.session.items[0]
      if (firstOpen) setActiveId(firstOpen.promptId)
    }
  }, [session, activeId])

  const submit = async (answer: string, assistance: Assistance) => {
    if (!id) return
    setBusy(true)
    const result = await recordAttempt(id, activeId, answer, assistance, newId('att'))
    setBusy(false)
    if (result.status === 'completed') {
      session.reload()
      toast('Answer saved · reference revealed')
    }
  }

  return (
    <div className="k-page">
      <AsyncPanel query={session} skeletonLines={8}>
        {({ data }) => {
          const prompt = data.prompts.find((item) => item.id === activeId) ?? data.prompts[0]
          const item = data.session.items.find((entry) => entry.promptId === prompt?.id)
          const attempt = item?.attemptIds.length ? data.attempts.find((entry) => entry.id === item.attemptIds[item.attemptIds.length - 1]) ?? null : null
          const readOnly = data.session.status === 'ended'
          return (
            <>
              <PageHeader
                back={{ to: routes.sessions, label: 'Sessions' }}
                eyebrow={
                  <span className="k-row">
                    <StatusPill tone={data.session.status === 'active' ? 'accent' : data.session.status === 'paused' ? 'warn' : 'neutral'} live={data.session.status === 'active'}>
                      {data.session.status}
                    </StatusPill>
                    <span>
                      {data.session.kind} · {data.session.items.length} prompts{data.session.sourceTitle ? ` · ${data.session.sourceTitle}` : ''}
                    </span>
                    {data.session.originRef ? <StatusPill tone="soft">origin {data.session.originRef.owner}</StatusPill> : null}
                  </span>
                }
                title={data.session.title}
                actions={
                  <>
                    <Button icon="sparkle" onClick={() => overlay.open('assistant')}>
                      Discuss
                    </Button>
                    <Button icon="flag" onClick={() => setCheckpointOpen(true)}>
                      Checkpoint
                    </Button>
                    {data.session.status === 'active' ? (
                      <Button
                        icon="pause"
                        onClick={async () => {
                          await pauseSession(data.session.id)
                          session.reload()
                          toast('Paused · state kept')
                        }}
                      >
                        Pause
                      </Button>
                    ) : null}
                    {data.session.status !== 'ended' ? (
                      <Button
                        variant="primary"
                        onClick={async () => {
                          await endSession(data.session.id)
                          session.reload()
                          setCheckpointOpen(true)
                        }}
                      >
                        End session
                      </Button>
                    ) : null}
                  </>
                }
              />
              <div className={styles.workspace}>
                <div className="k-stack" style={{ gap: 18 }}>
                  {readOnly ? <Notice glyph="◑">This session has ended. Attempts are read-only; resume from a checkpoint for a fresh session.</Notice> : null}
                  {prompt ? (
                    <PromptWorkspace
                      prompt={prompt}
                      attempt={attempt}
                      busy={busy}
                      readOnly={readOnly}
                      onSubmit={submit}
                      onSelfAssess={async (score) => {
                        if (!attempt) return
                        await recordSelfAssessment(attempt.id, score)
                        session.reload()
                      }}
                      onAskFeedback={async () => {
                        if (!attempt) return
                        session.mutate((current) => ({ ...current, attempts: current.attempts.map((entry) => (entry.id === attempt.id ? { ...entry, assessments: [...entry.assessments.filter((a) => a.state !== 'failed'), { id: 'pending', provenance: 'ai_draft', maxScore: 5, at: new Date().toISOString(), state: 'pending' }] } : entry)) }))
                        const result = await requestAiFeedback(attempt.id)
                        session.reload()
                        if (result.status === 'completed' && result.value.assessments.at(-1)?.state === 'failed') toast('Feedback failed · your answer is safe', { tone: 'warn' })
                      }}
                    />
                  ) : null}
                  <FocusTimer />
                </div>
                <div>
                  <Panel flush>
                    <PanelHead title="Prompts" eyebrow="Pinned revisions" />
                    <SessionItemList items={data.session.items} prompts={data.prompts} activeId={prompt?.id ?? ''} onSelect={setActiveId} />
                  </Panel>
                  <Panel>
                    <PanelHead title="Conversation" eyebrow="Persisted through Conversations" />
                    <p className="muted small">Discussion with the tutor is stored with this session and survives restarts.</p>
                    {data.session.conversationId ? (
                      <Link to={`${routes.conversations}/${data.session.conversationId}`} className="k-ref" style={{ marginTop: 8 }}>
                        <span className="k-ref__owner">conversations</span> · {data.session.conversationId}
                      </Link>
                    ) : null}
                  </Panel>
                </div>
              </div>
              <CheckpointPanel open={checkpointOpen} sessionId={data.session.id} sessionTitle={data.session.title} onClose={() => setCheckpointOpen(false)} onSaved={() => undefined} />
            </>
          )
        }}
      </AsyncPanel>
    </div>
  )
}
