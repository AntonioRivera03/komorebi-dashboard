import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { TextInput } from '../../shared/ui/TextInput'
import { TextArea } from '../../shared/ui/TextArea'
import { Select } from '../../shared/ui/Select'
import { useLearn } from './useLearn'
import { draftFromArtifacts, uid, type Artifact, type Deck, type Material } from './model'
import styles from './learn.module.css'
import { SourceComposer } from './SourceComposer'
import { DeckDraftEditor, DeckDraftList } from './DeckDrafts'
import { QuizPlayer } from './Quiz'
import { LearnStoragePanel } from './LearnStoragePanel'

export function PreviewNote() {
  return <LearnStoragePanel />
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>
}
export function SessionSelect({
  value,
  onChange,
  all = false,
}: {
  value: string
  onChange: (id: string) => void
  all?: boolean
}) {
  const { state } = useLearn()
  return (
    <Select
      aria-label="Session"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={[
        ...(all
          ? [{ value: '', label: 'All sessions' }]
          : [{ value: '', label: 'Choose a session', disabled: true }]),
        ...state.sessions.map((s) => ({ value: s.id, label: s.title })),
      ]}
    />
  )
}
export function TopicInput({
  sessionId,
  value,
  onChange,
}: {
  sessionId: string
  value: string
  onChange: (value: string) => void
}) {
  const { state } = useLearn()
  return (
    <Field label="Topic" htmlFor="learn-topic" hint="Choose one or write a new topic">
      <TextInput
        id="learn-topic"
        required
        list="learn-topics"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Everyday expressions"
        maxLength={100}
      />
      <datalist id="learn-topics">
        {state.sessions
          .find((s) => s.id === sessionId)
          ?.topics.map((t) => (
            <option key={t} value={t} />
          ))}
      </datalist>
    </Field>
  )
}
export type ComposerKind = 'session' | 'artifact' | 'deck' | 'card' | 'source' | 'quiz' | 'exam'
type ComposerProps = {
  kind: ComposerKind
  sessionId?: string
  deck?: Deck
  artifact?: Artifact
  onClose: () => void
}
export function Composer(props: ComposerProps) {
  return props.kind === 'source' ? (
    <SourceComposer sessionId={props.sessionId} onClose={props.onClose} />
  ) : (
    <BasicComposer {...props} kind={props.kind} />
  )
}
function BasicComposer({
  kind,
  sessionId = '',
  deck,
  artifact,
  onClose,
}: Omit<ComposerProps, 'kind'> & { kind: Exclude<ComposerKind, 'source'> }) {
  const { update } = useLearn()
  const [subject, setSubject] = useState(artifact?.sessionId ?? sessionId)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState(artifact?.body ?? '')
  const [topic, setTopic] = useState(artifact?.topic ?? deck?.topic ?? '')
  const [answer, setAnswer] = useState('')
  const titles = {
    session: 'New session',
    artifact: artifact ? 'Edit artifact' : 'Capture an artifact',
    deck: 'Create a deck',
    card: 'Add a flashcard',
    quiz: 'Create a quiz',
    exam: 'Add an exam plan',
  }
  return (
    <Dialog open onClose={onClose} title={titles[kind]} eyebrow={deck?.title}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          if (kind !== 'session' && (!subject || !topic.trim())) return
          if (kind === 'artifact' ? !body.trim() : !title.trim()) return
          if ((kind === 'card' || kind === 'quiz') && !answer.trim()) return
          const id = uid(),
            now = Date.now(),
            cleanTopic = topic.trim()
          update((current) => {
            let next = {
              ...current,
              sessions: current.sessions.map((s) =>
                s.id === subject ? { ...s, topics: [...new Set([...s.topics, cleanTopic])] } : s,
              ),
            }
            if (kind === 'session')
              next = {
                ...next,
                sessions: [
                  ...next.sessions,
                  {
                    id,
                    title: title.trim(),
                    description: body.trim(),
                    topics: [],
                    symbol: '◌',
                  },
                ],
              }
            if (kind === 'artifact') {
              const value = {
                ...artifact,
                id: artifact?.id ?? id,
                sessionId: subject,
                body: body.trim(),
                topic: cleanTopic,
                updatedAt: now,
              }
              next = {
                ...next,
                artifacts: artifact
                  ? next.artifacts.map((a) => (a.id === artifact.id ? value : a))
                  : [value, ...next.artifacts],
              }
            }
            if (kind === 'deck')
              next = {
                ...next,
                decks: [
                  ...next.decks,
                  {
                    id,
                    sessionId: subject,
                    title: title.trim(),
                    topic: cleanTopic,
                  },
                ],
              }
            if (kind === 'card' && deck)
              next = {
                ...next,
                cards: [
                  ...next.cards,
                  {
                    id,
                    deckId: deck.id,
                    topic: cleanTopic,
                    front: title.trim(),
                    back: answer.trim(),
                    repetitions: 0,
                    interval: 0,
                    ease: 2.5,
                    dueAt: now,
                  },
                ],
              }
            if (kind === 'quiz' || kind === 'exam')
              next = {
                ...next,
                materials: [
                  ...next.materials,
                  {
                    id,
                    sessionId: subject,
                    kind,
                    title: title.trim(),
                    topic: cleanTopic,
                    content: body.trim(),
                    answer: answer.trim(),
                  },
                ],
              }
            return next
          })
          onClose()
        }}
      >
        {kind !== 'session' && !sessionId && (
          <Field label="Session">
            <SessionSelect
              value={subject}
              onChange={(v) => {
                setSubject(v)
                setTopic('')
              }}
            />
          </Field>
        )}
        {kind !== 'artifact' && (
          <Field label={kind === 'card' ? 'Front · question' : 'Title'} htmlFor="learn-title">
            <TextInput
              id="learn-title"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              placeholder={kind === 'session' ? 'What would you like to learn?' : undefined}
            />
          </Field>
        )}
        {kind !== 'session' && <TopicInput sessionId={subject} value={topic} onChange={setTopic} />}
        {!['card', 'deck'].includes(kind) && (
          <Field
            label={
              kind === 'artifact'
                ? 'Your thought'
                : kind === 'quiz'
                  ? 'Question'
                  : kind === 'exam'
                    ? 'Date, format & what to cover'
                    : 'A short description'
            }
            htmlFor="learn-body"
          >
            <TextArea
              id="learn-body"
              required={kind !== 'session'}
              rows={4}
              maxLength={20000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              autoFocus={kind === 'artifact'}
            />
          </Field>
        )}
        {(kind === 'card' || kind === 'quiz') && (
          <Field
            label={kind === 'card' ? 'Back · answer' : 'Reference answer'}
            htmlFor="learn-answer"
          >
            <TextArea
              id="learn-answer"
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </Field>
        )}
        <div className={styles.cardFooter}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {artifact
              ? 'Save changes'
              : kind === 'artifact'
                ? 'Save artifact'
                : kind === 'card'
                  ? 'Add card'
                  : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
export function ArtifactList({ sessionId, topic = '' }: { sessionId?: string; topic?: string }) {
  const { state, update } = useLearn()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Artifact | null>(null)
  const artifacts = state.artifacts.filter(
    (a) => (!sessionId || a.sessionId === sessionId) && (!topic || a.topic === topic),
  )
  const selected = selectedIds.filter((id) => artifacts.some((a) => a.id === id))
  const groups = [...new Set(artifacts.map((a) => a.topic))]
  return (
    <>
      {!!artifacts.length && (
        <div className={styles.selectionBar}>
          <div className={styles.meta}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={selected.length === artifacts.length}
                onChange={(e) => setSelectedIds(e.target.checked ? artifacts.map((a) => a.id) : [])}
              />
              Select all visible
            </label>
            <span>
              {selected.length} selected{selected.length > 200 ? ' · choose up to 200' : ''}
            </span>
            <Button
              variant="primary"
              disabled={!selected.length || selected.length > 200}
              onClick={() => {
                const draft = draftFromArtifacts(state, selected, uid(), Date.now())
                update((s) => ({ ...s, deckDrafts: [...s.deckDrafts, draft] }))
                setSelectedIds([])
                setDraftId(draft.id)
              }}
            >
              Create deck draft
            </Button>
          </div>
        </div>
      )}
      {groups.length ? (
        groups.map((group) => (
          <section key={group} className={styles.section}>
            <div className={styles.heading}>
              <h2>{group}</h2>
              <span className="muted small">
                {artifacts.filter((a) => a.topic === group).length} artifacts
              </span>
            </div>
            <div className={styles.grid}>
              {artifacts
                .filter((a) => a.topic === group)
                .map((a) => (
                  <article key={a.id} className={styles.artifact}>
                    <label className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        aria-label={`Select artifact: ${a.body.slice(0, 60)}`}
                        checked={selected.includes(a.id)}
                        onChange={(e) =>
                          setSelectedIds(
                            e.target.checked
                              ? [...selected, a.id]
                              : selected.filter((id) => id !== a.id),
                          )
                        }
                      />
                      Select artifact
                    </label>
                    <p>{a.body}</p>
                    {a.highlightId &&
                      (() => {
                        const h = state.highlights.find((item) => item.id === a.highlightId)
                        const source = state.materials.find((m) => m.id === h?.sourceId)
                        return (
                          source && (
                            <Link
                              className="muted small"
                              to={`/learn/sessions/${source.sessionId}?section=Sources&source=${source.id}`}
                            >
                              View source passage ↗
                            </Link>
                          )
                        )
                      })()}
                    <div className={styles.cardFooter}>
                      <Link className="muted small" to={`/learn/sessions/${a.sessionId}`}>
                        {state.sessions.find((s) => s.id === a.sessionId)?.title}
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
                        Edit
                      </Button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))
      ) : (
        <Empty>
          No artifacts here yet. Capture a thought, a question, or something you want to remember.
        </Empty>
      )}
      <DeckDraftList sessionId={sessionId} />
      {draftId && <DeckDraftEditor id={draftId} onClose={() => setDraftId(null)} />}
      {editing && <Composer kind="artifact" artifact={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
export function MaterialCard({ material }: { material: Material }) {
  const [open, setOpen] = useState(false)
  return (
    <article className={styles.artifact}>
      <span className="label">{material.topic}</span>
      <h3>{material.title}</h3>
      <p className={`muted ${styles.materialExcerpt}`}>{material.content}</p>
      {material.kind === 'source' ? (
        <Link
          className="k-btn"
          to={`/learn/sessions/${material.sessionId}?section=Sources&source=${material.id}`}
        >
          Read source
        </Link>
      ) : material.kind === 'quiz' ? (
        <Button onClick={() => setOpen(true)}>
          Try quiz
          {material.questions ? ` · ${material.questions.length} questions` : ''}
        </Button>
      ) : material.route ? (
        <Link className="k-btn" to={`${material.route}?session=${material.sessionId}`}>
          Open {material.kind}
        </Link>
      ) : (
        <Button onClick={() => setOpen(true)}>Open</Button>
      )}
      {open &&
        (material.kind === 'quiz' ? (
          <QuizPlayer quiz={material} onClose={() => setOpen(false)} />
        ) : (
          <Dialog open onClose={() => setOpen(false)} title={material.title}>
            <p className={styles.answer}>{material.content}</p>
          </Dialog>
        ))}
    </article>
  )
}
