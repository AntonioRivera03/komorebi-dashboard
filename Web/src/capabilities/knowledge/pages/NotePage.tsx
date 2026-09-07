import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Tag } from '../../../shared/ui/Tag'
import { TextArea } from '../../../shared/ui/TextArea'
import { Field } from '../../../shared/ui/Field'
import { Notice } from '../../../shared/ui/Notice'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { useOperation } from '../../../shared/hooks/useOperation'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { formatRelative } from '../../../shared/lib/format'
import { useNote } from '../interfaces/useNote'
import { acceptEnrichment, addRelation, reviseNote } from '../interfaces/knowledgeApi'
import { AddRelationDialog } from '../components/AddRelationDialog'
import { OpenQuestionList } from '../components/OpenQuestionList'
import { RelationList } from '../components/RelationList'
import { SourceLinkList } from '../components/SourceLinkList'
import styles from '../knowledge.module.css'

export default function NotePage() {
  const { id } = useParams()
  const note = useNote(id)
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState('')
  const [questions, setQuestions] = useState('')
  const [linking, setLinking] = useState(false)
  const revise = useOperation(reviseNote)
  const relate = useOperation(addRelation)

  useEffect(() => {
    if (note.status === 'ready') {
      setBody(note.snapshot.data.body)
      setQuestions(note.snapshot.data.openQuestions.join('\n'))
    }
  }, [note.status, note.snapshot])

  const save = async () => {
    if (!note.snapshot) return
    const result = await revise.run(note.snapshot.data.id, { body, openQuestions: questions.split('\n').map((q) => q.trim()).filter(Boolean), status: 'active' }, note.snapshot.data.revision, 'Edited explanation')
    if (result.status === 'completed') {
      note.mutate(() => result.value)
      setEditing(false)
      toast(`Saved as revision ${result.value.revision} · history preserved`)
    }
  }

  return (
    <div className="k-page">
      <AsyncPanel query={note} skeletonLines={8}>
        {({ data }) => (
          <>
            <PageHeader
              back={{ to: routes.notes, label: 'Notes' }}
              eyebrow={
                <span className="k-row">
                  <StatusPill tone={data.status === 'active' ? 'accent' : 'neutral'}>{data.status}</StatusPill>
                  <span>
                    rev {data.revision} · updated {formatRelative(data.updatedAt)}
                  </span>
                  {data.topics.map((topic) => (
                    <Tag key={topic}>{topic}</Tag>
                  ))}
                </span>
              }
              title={data.title}
              actions={
                editing ? (
                  <>
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      Discard
                    </Button>
                    <Button variant="primary" onClick={save} busy={revise.busy}>
                      Save revision
                    </Button>
                  </>
                ) : (
                  <>
                    <Button icon="link" onClick={() => setLinking(true)}>
                      Link a note
                    </Button>
                    <Button variant="primary" icon="edit" onClick={() => setEditing(true)}>
                      Revise
                    </Button>
                  </>
                )
              }
            />
            <div className="k-grid k-grid--2">
              <div>
                {editing ? (
                  <div className={styles.editor}>
                    <TextArea value={body} onChange={(event) => setBody(event.target.value)} aria-label="Explanation" />
                    <Field label="Open questions" hint="one per line">
                      <TextArea rows={3} value={questions} onChange={(event) => setQuestions(event.target.value)} />
                    </Field>
                    <OperationBanner state={revise.state} onRetry={save} />
                  </div>
                ) : (
                  <p className={styles.prose}>{data.body}</p>
                )}
                <Panel>
                  <PanelHead title="Open questions" eyebrow="Marked, not forgotten" />
                  <OpenQuestionList questions={data.openQuestions} />
                </Panel>
                <Panel>
                  <PanelHead title="History" eyebrow="Useful revisions preserved" />
                  {data.history.map((entry) => (
                    <div key={entry.revision} className="k-list-row">
                      <span className="mono small" style={{ color: 'var(--accent)' }}>
                        r{entry.revision}
                      </span>
                      <span className="k-list-row__main">{entry.summary}</span>
                      <span className="muted small mono">{formatRelative(entry.at)}</span>
                    </div>
                  ))}
                </Panel>
              </div>
              <div>
                <Panel flush>
                  <PanelHead title="Sources" eyebrow="References, not copies" />
                  <SourceLinkList links={data.sourceLinks} />
                </Panel>
                <Panel>
                  <PanelHead title="Relations" eyebrow="Typed, with a reason" />
                  <RelationList relations={data.relations} />
                </Panel>
                {data.aiEnrichment ? (
                  <Panel>
                    <PanelHead title="AI enrichment" eyebrow="Generated draft · provenance kept" meta={data.aiEnrichment.accepted ? <StatusPill tone="ok">accepted</StatusPill> : null} />
                    <p style={{ fontSize: 12, lineHeight: 1.5 }}>{data.aiEnrichment.summary}</p>
                    <div className="k-row" style={{ marginTop: 10 }}>
                      {data.aiEnrichment.suggestedTags.map((tag) => (
                        <Tag key={tag} outline>
                          + {tag}
                        </Tag>
                      ))}
                      {!data.aiEnrichment.accepted ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            const result = await acceptEnrichment(data.id)
                            if (result.status === 'completed') note.mutate(() => result.value)
                          }}
                        >
                          Accept tags
                        </Button>
                      ) : null}
                    </div>
                  </Panel>
                ) : null}
                <div style={{ marginTop: 16 }}>
                  <Notice glyph="⛨">Search results, backlinks and AI context all check current access. A deleted source shows here as a redacted marker, never as leaked text.</Notice>
                </div>
              </div>
            </div>
            <AddRelationDialog
              open={linking}
              noteId={data.id}
              busy={relate.busy}
              onClose={() => setLinking(false)}
              onAdd={async (type, targetId, why) => {
                const result = await relate.run(data.id, type, targetId, why)
                if (result.status === 'completed') {
                  note.mutate(() => result.value)
                  setLinking(false)
                  toast('Relation added')
                }
              }}
            />
          </>
        )}
      </AsyncPanel>
    </div>
  )
}
