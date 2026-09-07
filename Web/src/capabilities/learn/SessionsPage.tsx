import { useState } from 'react'
import { Link } from 'react-router'
import { useNow } from '../../shared/hooks/useNow'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Button } from '../../shared/ui/Button'
import { useLearn } from './useLearn'
import { Composer, Empty, PreviewNote } from './components'
import styles from './learn.module.css'

export default function SessionsPage() {
  const { state } = useLearn()
  const now = useNow().getTime()
  const [creating, setCreating] = useState(false)
  return (
    <div className={`k-page ${styles.page}`}>
      <PageHeader
        title="Sessions"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New session
          </Button>
        }
      />
      <div className={styles.grid}>
        {state.sessions.map((s) => {
          const decks = state.decks.filter((d) => d.sessionId === s.id)
          const due = state.cards.filter((c) => decks.some((d) => d.id === c.deckId) && c.dueAt <= now).length
          return (
            <Link key={s.id} to={`/learn/sessions/${s.id}`} className={styles.session}>
              <div className={styles.heading} style={{ marginBottom: 0 }}>
                <span className={styles.symbol}>{s.symbol}</span>
                <span className="muted">Open session ↗</span>
              </div>
              <h2>{s.title}</h2>
              <p className="muted">{s.description || 'A fresh space for your next discovery.'}</p>
              <div className={styles.meta}>
                {s.topics.slice(0, 3).map((t) => (
                  <span className={styles.chip} key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <span className="muted small">
                  {state.materials.filter((m) => m.sessionId === s.id && m.kind === 'source').length} sources
                  · {state.artifacts.filter((a) => a.sessionId === s.id).length} artifacts · {decks.length}{' '}
                  decks
                </span>
                <span className="small">{due ? `${due} cards due` : 'All caught up'}</span>
              </div>
            </Link>
          )
        })}
      </div>
      {!state.sessions.length && (
        <Empty>Create your first session around a subject or a topic you’d like to explore.</Empty>
      )}
      {creating && <Composer kind="session" onClose={() => setCreating(false)} />}
      <PreviewNote />
    </div>
  )
}
