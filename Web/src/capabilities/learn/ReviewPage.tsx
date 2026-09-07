import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useNow } from '../../shared/hooks/useNow'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { useLearn } from './useLearn'
import { dayKey, schedule, uid, type Deck } from './model'
import { Composer, Empty, PreviewNote, SessionSelect } from './components'
import styles from './learn.module.css'
import { DeckDraftList } from './DeckDrafts'
import { QuizComposer } from './Quiz'

const qualities = [
  ['Blank', 'Nothing came to mind'],
  ['Recognized', 'Remembered after revealing'],
  ['Almost', 'Missed an answer I knew'],
  ['Difficult', 'Correct, with real effort'],
  ['Good', 'Correct, after a hesitation'],
  ['Easy', 'Immediate, confident recall'],
]
function ReviewRound({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const { state, update } = useLearn()
  const now = useNow(1000).getTime()
  const [queue, setQueue] = useState(ids)
  const [revealed, setRevealed] = useState(false)
  const [count, setCount] = useState(0)
  const rating = useRef(false)
  const card = state.cards.find((c) => c.id === queue[0])
  const deck = state.decks.find((d) => d.id === card?.deckId)
  return (
    <Dialog
      open
      onClose={onClose}
      title={card ? (deck?.title ?? 'Review') : 'A little more remembered.'}
      eyebrow={card ? `${queue.length} cards remaining · SM-2` : 'Review complete'}
      wide
    >
      {card ? (
        <>
          <div className={styles.flashcard}>
            <span className={styles.chip}>{card.topic}</span>
            <h2>{card.front}</h2>
            {revealed && <p className={styles.answer}>{card.back}</p>}
          </div>
          {revealed ? (
            <>
              <p className="label" style={{ marginBottom: 12 }}>
                How well did you remember?
              </p>
              <div className={styles.ratings}>
                {qualities.map(([label, help], quality) => (
                  <button
                    key={quality}
                    className={styles.rating}
                    title={help}
                    onClick={() => {
                      if (rating.current) return
                      rating.current = true
                      const at = Date.now(),
                        reviewId = uid()
                      update((current) => {
                        const previous = current.cards.find((c) => c.id === card.id)!
                        const scheduled = schedule(previous, quality, at)
                        // SM-2 repeats grades below four in the same round. Keep them due if the round is closed.
                        const next = quality < 4 ? { ...scheduled, dueAt: at } : scheduled
                        return {
                          ...current,
                          cards: current.cards.map((c) => (c.id === card.id ? next : c)),
                          reviews: [
                            ...current.reviews,
                            {
                              id: reviewId,
                              cardId: card.id,
                              deckId: card.deckId,
                              sessionId: deck!.sessionId,
                              quality,
                              at,
                              previous,
                              next,
                            },
                          ],
                        }
                      })
                      setQueue((current) =>
                        quality < 4 ? [...current.slice(1), card.id] : current.slice(1),
                      )
                      setRevealed(false)
                      setCount((c) => c + 1)
                    }}
                  >
                    <strong>
                      {quality} · {label}
                    </strong>
                    <small>
                      {quality < 4
                        ? 'Again this round'
                        : `${schedule(card, quality, now).interval} days`}
                    </small>
                  </button>
                ))}
              </div>
              <p className="muted small" style={{ marginTop: 12 }}>
                Grades 0–2: incorrect. Grade 3: difficult recall. These cards return this round.
              </p>
            </>
          ) : (
            <Button
              block
              variant="primary"
              onClick={() => {
                rating.current = false
                setRevealed(true)
              }}
            >
              Reveal answer
            </Button>
          )}
          <div className={styles.cardFooter} style={{ marginTop: 20 }}>
            <span className="muted small">{count} reviews recorded</span>
            <Button variant="ghost" onClick={onClose}>
              Finish for now
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.flashcard}>
          <span className={styles.symbol}>✓</span>
          <h2>You’re done for now.</h2>
          <p className="muted">
            {count} reviews recorded. Your cards will be here when they’re due again.
          </p>
          <Button variant="primary" onClick={onClose}>
            Back to decks
          </Button>
        </div>
      )}
    </Dialog>
  )
}
export function DeckList({ sessionId = '' }: { sessionId?: string }) {
  const { state, update } = useLearn()
  const now = useNow(1000).getTime()
  const [cardIds, setCardIds] = useState<string[]>([])
  const [quizIds, setQuizIds] = useState<string[] | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [adding, setAdding] = useState<Deck | null>(null)
  const [reviewing, setReviewing] = useState<string[] | null>(null)
  const decks = state.decks.filter((d) => !sessionId || d.sessionId === sessionId)
  const selected = state.decks.find((d) => d.id === viewing)
  return (
    <>
      <div className={styles.grid}>
        {decks.map((deck) => {
          const cards = state.cards.filter((c) => c.deckId === deck.id)
          const due = cards.filter((c) => c.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)
          const session = state.sessions.find((s) => s.id === deck.sessionId)
          return (
            <article key={deck.id} className={styles.panel}>
              <div className={styles.heading}>
                <span className="label">{session?.title}</span>
                <span className={styles.chip}>{due.length} due</span>
              </div>
              <h3>{deck.title}</h3>
              <div className={styles.meta} style={{ margin: '12px 0 24px' }}>
                <span>{cards.length} cards</span>
                <span>·</span>
                <span>{deck.topic}</span>
              </div>
              <div className={styles.cardFooter}>
                <Button
                  variant="primary"
                  disabled={!due.length}
                  onClick={() => setReviewing(due.map((c) => c.id))}
                >
                  {due.length ? 'Review deck' : cards.length ? 'Caught up' : 'No cards yet'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewing(deck.id)
                    setCardIds([])
                  }}
                >
                  Open deck ↗
                </Button>
              </div>
            </article>
          )
        })}
      </div>
      {!decks.length && (
        <Empty>No decks yet. Create one, attach it to a session, and add your first cards.</Empty>
      )}
      {selected && (
        <Dialog
          open={!adding && !quizIds}
          onClose={() => setViewing(null)}
          title={selected.title}
          wide
        >
          <div className={styles.form}>
            <Field label="Attached session">
              <SessionSelect
                value={selected.sessionId}
                onChange={(value) =>
                  update((s) => ({
                    ...s,
                    decks: s.decks.map((d) =>
                      d.id === selected.id ? { ...d, sessionId: value } : d,
                    ),
                    sessions: s.sessions.map((subject) =>
                      subject.id === value
                        ? {
                            ...subject,
                            topics: [
                              ...new Set([
                                ...subject.topics,
                                selected.topic,
                                ...s.cards
                                  .filter((c) => c.deckId === selected.id)
                                  .map((c) => c.topic),
                              ]),
                            ],
                          }
                        : subject,
                    ),
                  }))
                }
              />
            </Field>
            <div className={styles.heading}>
              <span className="muted">
                {state.cards.filter((c) => c.deckId === selected.id).length} cards ·{' '}
                {selected.topic}
              </span>
              <Button icon="plus" onClick={() => setAdding(selected)}>
                Add card
              </Button>
            </div>
            <div className={styles.selectionBar}>
              <div className={styles.meta}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    aria-label="Select all cards"
                    checked={
                      !!state.cards.filter((c) => c.deckId === selected.id).length &&
                      cardIds.length === state.cards.filter((c) => c.deckId === selected.id).length
                    }
                    onChange={(e) =>
                      setCardIds(
                        e.target.checked
                          ? state.cards.filter((c) => c.deckId === selected.id).map((c) => c.id)
                          : [],
                      )
                    }
                  />
                  Select all cards
                </label>
                <span>
                  {cardIds.length} selected{cardIds.length > 200 ? ' · choose up to 200' : ''}
                </span>
                <Button
                  variant="primary"
                  disabled={!cardIds.length || cardIds.length > 200}
                  onClick={() => setQuizIds(cardIds)}
                >
                  Create quiz
                </Button>
              </div>
            </div>
            {state.cards
              .filter((c) => c.deckId === selected.id)
              .map((c) => (
                <article key={c.id} className={styles.artifact}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      aria-label={`Select card: ${c.front}`}
                      checked={cardIds.includes(c.id)}
                      onChange={(e) =>
                        setCardIds(
                          e.target.checked
                            ? [...cardIds, c.id]
                            : cardIds.filter((id) => id !== c.id),
                        )
                      }
                    />
                    Select card
                  </label>
                  <span className="label">
                    {c.topic} ·{' '}
                    {c.dueAt <= now ? 'Due now' : `Due ${new Date(c.dueAt).toLocaleDateString()}`}
                  </span>
                  <strong>{c.front}</strong>
                  <p>{c.back}</p>
                </article>
              ))}
            {!state.cards.some((c) => c.deckId === selected.id) && (
              <Empty>Add a question and an answer to start this deck.</Empty>
            )}
          </div>
        </Dialog>
      )}
      <DeckDraftList sessionId={sessionId} />
      {quizIds && (
        <QuizComposer
          cardIds={quizIds}
          onClose={() => {
            setQuizIds(null)
            setCardIds([])
          }}
        />
      )}
      {adding && (
        <Composer
          kind="card"
          sessionId={adding.sessionId}
          deck={adding}
          onClose={() => setAdding(null)}
        />
      )}
      {reviewing && <ReviewRound ids={reviewing} onClose={() => setReviewing(null)} />}
    </>
  )
}
function ReviewHistory({ sessionId }: { sessionId: string }) {
  const { state } = useLearn()
  const now = useNow(1000).getTime()
  const [days, setDays] = useState(30)
  const history = state.reviews.filter((r) => !sessionId || r.sessionId === sessionId)
  const points = Array.from({ length: days }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - days + 1 + i)
    const key = dayKey(d.getTime())
    return {
      label: d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      count: history.filter((r) => dayKey(r.at) === key).length,
    }
  })
  const max = Math.max(4, ...points.map((p) => p.count))
  const coordinates = points
    .map((p, i) => `${42 + (i / (days - 1)) * 716},${174 - (p.count / max) * 132}`)
    .join(' ')
  const total = points.reduce((sum, p) => sum + p.count, 0)
  return (
    <section className={`${styles.panel} ${styles.section}`}>
      <div className={styles.heading}>
        <div>
          <h2>Review history</h2>
          <p className="muted small">
            {total} reviews over the last {days} days
          </p>
        </div>
        <div className={styles.meta} role="group" aria-label="History range">
          {[7, 30, 90].map((n) => (
            <Button
              size="sm"
              key={n}
              variant={n === days ? 'soft' : 'ghost'}
              aria-pressed={n === days}
              onClick={() => setDays(n)}
            >
              {n}d
            </Button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 800 214"
        className={styles.graph}
        role="img"
        aria-label={`Review history: ${total} completed reviews in the last ${days} days`}
      >
        <title>Completed reviews by day</title>
        {[0, max / 2, max].map((n) => {
          const y = 174 - (n / max) * 132
          return (
            <g key={n}>
              <line
                x1="42"
                x2="758"
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeDasharray={n ? '3 5' : undefined}
              />
              <text x="25" y={y + 4} textAnchor="end">
                {Math.round(n)}
              </text>
            </g>
          )
        })}
        <polyline
          points={coordinates}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={42 + (i / (days - 1)) * 716}
            cy={174 - (p.count / max) * 132}
            r={p.count ? 3.5 : 0}
            fill="currentColor"
          >
            <title>{`${p.label}: ${p.count} reviews`}</title>
          </circle>
        ))}
        {[0, Math.floor(days / 2), days - 1].map((i) => (
          <text
            key={i}
            x={42 + (i / (days - 1)) * 716}
            y="203"
            textAnchor={i === 0 ? 'start' : i === days - 1 ? 'end' : 'middle'}
          >
            {points[i].label}
          </text>
        ))}
      </svg>
      {!total && (
        <p className="muted small">
          Your history starts with your first review. Each rating adds a point to your day.
        </p>
      )}
      <details style={{ marginTop: 12 }}>
        <summary className="muted small">View daily counts</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}>
                  <td>{p.label}</td>
                  <td>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
export default function ReviewPage() {
  const { state } = useLearn()
  const now = useNow(1000).getTime()
  const [params, setParams] = useSearchParams()
  const sessionId = params.get('session') ?? ''
  const [creating, setCreating] = useState(false)
  const [reviewing, setReviewing] = useState<string[] | null>(null)
  const decks = state.decks.filter((d) => !sessionId || d.sessionId === sessionId)
  const due = state.cards
    .filter((c) => decks.some((d) => d.id === c.deckId) && c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
  return (
    <div className={`k-page ${styles.page}`}>
      <PageHeader
        title="Review"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            Create deck
          </Button>
        }
      />
      <div className={styles.heading}>
        <div className={styles.stats}>
          <strong>{due.length}</strong>
          <span>cards ready to review</span>
        </div>
        <Button
          variant="primary"
          disabled={!due.length}
          onClick={() => setReviewing(due.map((c) => c.id))}
        >
          Review all due
        </Button>
      </div>
      <div className={styles.filters}>
        <SessionSelect
          all
          value={sessionId}
          onChange={(value) => setParams(value ? { session: value } : {})}
        />
        <span className="muted small">SM-2</span>
        {sessionId && (
          <Link className="muted small" to={`/learn/sessions/${sessionId}`}>
            Back to session ↗
          </Link>
        )}
      </div>
      <DeckList sessionId={sessionId} />
      <ReviewHistory sessionId={sessionId} />
      {creating && (
        <Composer kind="deck" sessionId={sessionId} onClose={() => setCreating(false)} />
      )}
      {reviewing && <ReviewRound ids={reviewing} onClose={() => setReviewing(null)} />}
      <PreviewNote />
    </div>
  )
}
