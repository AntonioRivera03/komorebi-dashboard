import { useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Button } from '../../shared/ui/Button'
import { useLearn } from './useLearn'
import {
  ArtifactList,
  Composer,
  Empty,
  MaterialCard,
  PreviewNote,
  type ComposerKind,
} from './components'
import { DeckList } from './ReviewPage'
import { SourcesWorkspace } from './SourcesWorkspace'
import styles from './learn.module.css'

const sections = ['Overview', 'Sources', 'Artifacts', 'Flashcards', 'Quizzes', 'Exams'] as const
export default function SessionPage() {
  const { id } = useParams()
  const { state } = useLearn()
  const [params, setParams] = useSearchParams()
  const selected = params.get('section') ?? 'Overview'
  const section = sections.find((s) => s === selected) ?? 'Overview'
  const [creating, setCreating] = useState<ComposerKind | null>(null)
  const session = state.sessions.find((s) => s.id === id)
  if (!session && id?.startsWith('ses_')) return <Navigate to={`/learn/practice/${id}`} replace />
  if (!session)
    return (
      <div className="k-page">
        <PageHeader
          title="Session not found"
          back={{ to: '/learn/sessions', label: 'All sessions' }}
        />
        <Empty>This subject space is unavailable.</Empty>
      </div>
    )
  const materials = state.materials.filter((m) => m.sessionId === id)
  const actions: Record<string, ComposerKind> = {
    Sources: 'source',
    Artifacts: 'artifact',
    Flashcards: 'deck',
    Quizzes: 'quiz',
    Exams: 'exam',
  }
  return (
    <div className={`k-page ${styles.page}`}>
      <PageHeader
        back={{ to: '/learn/sessions', label: 'All sessions' }}
        title={session.title}
        subtitle={session.description}
        actions={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setCreating(actions[section] ?? 'artifact')}
          >
            {section === 'Overview' || section === 'Artifacts'
              ? 'Capture artifact'
              : section === 'Flashcards'
                ? 'Create deck'
                : `Add ${actions[section]}`}
          </Button>
        }
      />
      <div className={styles.meta}>
        {session.topics.map((t) => (
          <span className={styles.chip} key={t}>
            {t}
          </span>
        ))}
      </div>
      <nav className={styles.tabs} aria-label="Session contents">
        {sections.map((s) => (
          <button
            key={s}
            aria-pressed={section === s}
            onClick={() => setParams(s === 'Overview' ? {} : { section: s })}
          >
            {s}
          </button>
        ))}
      </nav>
      {section === 'Overview' && (
        <>
          <div className={styles.homeGrid}>
            <section className={styles.panel}>
              <h2>Study</h2>
              <div className={styles.meta} style={{ marginTop: 24 }}>
                <Button onClick={() => setParams({ section: 'Sources' })}>Explore sources</Button>
                <Link className="k-btn k-btn--primary" to={`/learn/review?session=${id}`}>
                  Review flashcards
                </Link>
              </div>
            </section>
            <section className={styles.panel}>
              <div className={styles.heading}>
                <h2>In this session</h2>
                <span className={styles.symbol}>{session.symbol}</span>
              </div>
              {(['Sources', 'Artifacts', 'Flashcards', 'Quizzes', 'Exams'] as const).map((s) => (
                <button
                  className={styles.row}
                  style={{
                    background: 'none',
                    borderLeft: 0,
                    borderRight: 0,
                    borderBottom: 0,
                    width: '100%',
                    textAlign: 'left',
                  }}
                  key={s}
                  onClick={() => setParams({ section: s })}
                >
                  <span>{s}</span>
                  <span className="muted">
                    {s === 'Artifacts'
                      ? state.artifacts.filter((a) => a.sessionId === id).length
                      : s === 'Flashcards'
                        ? `${state.decks.filter((d) => d.sessionId === id).length} decks`
                        : materials.filter(
                            (m) =>
                              m.kind ===
                              (
                                { Sources: 'source', Quizzes: 'quiz', Exams: 'exam' } as Record<
                                  string,
                                  string
                                >
                              )[s],
                          ).length}{' '}
                    ↗
                  </span>
                </button>
              ))}
            </section>
          </div>
          <section className={styles.section}>
            <div className={styles.heading}>
              <h2>Gathered thoughts</h2>
              <Button variant="ghost" onClick={() => setParams({ section: 'Artifacts' })}>
                All artifacts ↗
              </Button>
            </div>
            <ArtifactList sessionId={id} />
          </section>
        </>
      )}
      {section === 'Artifacts' && <ArtifactList sessionId={id} />}
      {section === 'Flashcards' && <DeckList sessionId={id} />}
      {section === 'Sources' && (
        <SourcesWorkspace sessionId={session.id} onAdd={() => setCreating('source')} />
      )}
      {['Quizzes', 'Exams'].includes(section) && (
        <>
          {materials.filter((m) => m.kind === actions[section]).length ? (
            <div className={styles.grid}>
              {materials
                .filter((m) => m.kind === actions[section])
                .map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
            </div>
          ) : (
            <Empty>No {section.toLowerCase()} yet. Add one to keep your material together.</Empty>
          )}
        </>
      )}
      {creating && <Composer kind={creating} sessionId={id} onClose={() => setCreating(null)} />}
      <PreviewNote />
    </div>
  )
}
