import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { TextArea } from '../../shared/ui/TextArea'
import { TextInput } from '../../shared/ui/TextInput'
import { Select } from '../../shared/ui/Select'
import { useLearn } from './useLearn'
import { publishDeckDraft, type DeckDraft } from './model'
import styles from './learn.module.css'

export function DeckDraftEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, update } = useLearn()
  const draft = state.deckDrafts.find((d) => d.id === id)
  const [error, setError] = useState('')
  if (!draft) return null
  const change = (edit: (d: DeckDraft) => DeckDraft) => {
    const at = Date.now()
    update((s) => ({
      ...s,
      deckDrafts: s.deckDrafts.map((d) =>
        d.id === id && !d.publishedDeckId ? { ...edit(d), updatedAt: at } : d,
      ),
    }))
    setError('')
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title={draft.publishedDeckId ? 'Published deck draft' : 'Preview deck draft'}
      wide
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          try {
            const at = Date.now()
            publishDeckDraft(state, id, at)
            update((s) => publishDeckDraft(s, id, at))
          } catch (err) {
            setError((err as Error).message)
          }
        }}
      >
        {draft.publishedDeckId && (
          <p role="status">
            Deck created.{' '}
            <Link to={`/learn/review?session=${draft.sessionId}`} onClick={onClose}>
              Open your decks ↗
            </Link>
          </p>
        )}
        <p className="muted small">
          Each selected Artifact becomes an answer. Write a question, edit either side, or remove
          cards before creating the deck. Drafts stay out of Review.
        </p>
        <Field label="Deck title" htmlFor="draft-title">
          <TextInput
            id="draft-title"
            required
            maxLength={300}
            value={draft.title}
            disabled={!!draft.publishedDeckId}
            onChange={(e) => change((d) => ({ ...d, title: e.target.value }))}
          />
        </Field>
        <Field label="Session">
          <Select
            aria-label="Draft session"
            value={draft.sessionId}
            disabled={!!draft.publishedDeckId}
            options={state.sessions.map((s) => ({
              value: s.id,
              label: s.title,
            }))}
            onChange={(e) => change((d) => ({ ...d, sessionId: e.target.value }))}
          />
        </Field>
        <Field label="Topic" htmlFor="draft-topic">
          <TextInput
            id="draft-topic"
            required
            maxLength={100}
            value={draft.topic}
            disabled={!!draft.publishedDeckId}
            onChange={(e) => change((d) => ({ ...d, topic: e.target.value }))}
          />
        </Field>
        {draft.cards.map((card, index) => (
          <article className={styles.artifact} key={card.id}>
            <div className={styles.heading}>
              <h3>Card {index + 1}</h3>
              <Button
                size="sm"
                disabled={!!draft.publishedDeckId}
                onClick={() =>
                  change((d) => ({
                    ...d,
                    cards: d.cards.filter((c) => c.id !== card.id),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <Field label="Front · question" htmlFor={`front-${card.id}`}>
              <TextArea
                id={`front-${card.id}`}
                rows={2}
                required
                maxLength={20000}
                disabled={!!draft.publishedDeckId}
                placeholder="What would you like to be able to recall?"
                value={card.front}
                onChange={(e) =>
                  change((d) => ({
                    ...d,
                    cards: d.cards.map((c) =>
                      c.id === card.id ? { ...c, front: e.target.value } : c,
                    ),
                  }))
                }
              />
            </Field>
            <Field label="Back · answer" htmlFor={`back-${card.id}`}>
              <TextArea
                id={`back-${card.id}`}
                rows={4}
                required
                maxLength={20000}
                disabled={!!draft.publishedDeckId}
                value={card.back}
                onChange={(e) =>
                  change((d) => ({
                    ...d,
                    cards: d.cards.map((c) =>
                      c.id === card.id ? { ...c, back: e.target.value } : c,
                    ),
                  }))
                }
              />
            </Field>
            <details>
              <summary className="muted small">Linked artifact</summary>
              <p className={styles.excerpt}>
                {state.artifacts.find((a) => a.id === card.artifactId)?.body ??
                  'Artifact unavailable'}
              </p>
            </details>
          </article>
        ))}
        {!draft.cards.length && (
          <p className="muted">
            No cards left. Close this draft and select Artifacts to start another.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <div className={styles.cardFooter}>
          <Button onClick={onClose}>Close draft</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!draft.cards.length || !!draft.publishedDeckId}
          >
            Create deck · {draft.cards.length} cards
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function DeckDraftList({ sessionId = '' }: { sessionId?: string }) {
  const { state, update } = useLearn()
  const [editing, setEditing] = useState<string | null>(null)
  const drafts = state.deckDrafts.filter(
    (d) => !d.publishedDeckId && (!sessionId || d.sessionId === sessionId),
  )
  if (!drafts.length) return null
  return (
    <section className={styles.section}>
      <h2>Deck drafts · {drafts.length}</h2>
      <div className={styles.grid} style={{ marginTop: 20 }}>
        {drafts.map((d) => (
          <article key={d.id} className={styles.artifact}>
            <h3>{d.title}</h3>
            <span className="muted small">
              {d.cards.length} cards · {d.topic}
            </span>
            <div className={styles.cardFooter}>
              <Button variant="primary" onClick={() => setEditing(d.id)}>
                Preview & edit
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  update((s) => ({
                    ...s,
                    deckDrafts: s.deckDrafts.filter((item) => item.id !== d.id),
                  }))
                }
              >
                Discard draft
              </Button>
            </div>
          </article>
        ))}
      </div>
      {editing && <DeckDraftEditor id={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}
