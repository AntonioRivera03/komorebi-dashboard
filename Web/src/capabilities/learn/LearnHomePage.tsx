import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { TextInput } from '../../shared/ui/TextInput'
import { Select } from '../../shared/ui/Select'
import { useLearn } from './useLearn'
import { useNow } from '../../shared/hooks/useNow'
import {
  dayKey,
  freshFocus,
  focusSecondsRemaining,
  stopFocus,
  setFocusMinutes,
  toggleFocus,
  validFocusMinutes,
} from './model'
import { Switch } from '../../shared/ui/Switch'
import { finishFocusSound, playFocusJingle, stopFocusAlarm, unlockFocusAudio } from './focusSound'
import { Empty, PreviewNote } from './components'
import styles from './learn.module.css'

export default function LearnHomePage() {
  const { state, update } = useLearn()
  const [cardId, setCardId] = useState(() => state.cards[Math.floor(Math.random() * state.cards.length)]?.id)
  const [revealed, setRevealed] = useState(false)
  const [durationDraft, setDurationDraft] = useState<string | null>(null)
  const [soundError, setSoundError] = useState(false)
  const now = useNow(500).getTime()
  const card = state.cards.find((c) => c.id === cardId) ?? state.cards[0]
  const deck = state.decks.find((d) => d.id === card?.deckId)
  const session = state.sessions.find((s) => s.id === deck?.sessionId)
  const f = state.focus
  const duration = durationDraft ?? String(f.focusMinutes)
  const durationValid = validFocusMinutes(Number(duration))
  const remaining = focusSecondsRemaining(f, now)
  const finished = f.completedAt !== null
  const reviewed = new Set(state.reviews.filter((r) => dayKey(r.at) === dayKey(now)).map((r) => r.cardId))
    .size
  const todayFocus = state.focusLog.filter((l) => dayKey(l.completedAt) === dayKey(now))
  return (
    <div className={`k-page ${styles.page}`}>
      <PageHeader
        title="Make room to learn."
        actions={
          <Link className="k-btn" to="/learn/sessions">
            Explore sessions ↗
          </Link>
        }
      />
      <div className={styles.homeGrid}>
        <section className={styles.panel}>
          <div className={styles.heading}>
            <span className={styles.chip}>{session?.title ?? 'Your collection'}</span>
          </div>
          {card ? (
            <>
              <div className={styles.meta}>
                <span>{deck?.title}</span>
                <span>·</span>
                <span>{card.topic}</span>
              </div>
              <div className={styles.flashcard}>
                <h2>{card.front}</h2>
                {revealed && <p className={styles.answer}>{card.back}</p>}
              </div>
              <div className={styles.cardFooter}>
                <Button variant="primary" onClick={() => setRevealed(!revealed)}>
                  {revealed ? 'Hide answer' : 'Reveal answer'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={state.cards.length < 2}
                  onClick={() => {
                    const other = state.cards.filter((c) => c.id !== card.id)
                    setCardId(other[Math.floor(Math.random() * other.length)].id)
                    setRevealed(false)
                  }}
                >
                  Another card ↻
                </Button>
              </div>
              <p className="muted small" style={{ marginTop: 16 }}>
                <Link to="/learn/review" className={styles.suggestion}>
                  Head to Review to study your decks.
                </Link>
              </p>
            </>
          ) : (
            <Empty>Create a deck in Review to see a flashcard here.</Empty>
          )}
        </section>
        <section className={styles.panel}>
          <div className={styles.heading}>
            <span className="label">Pomodoro</span>
            <span className={styles.chip}>
              {f.mode === 'focus' ? `${f.focusMinutes} min focus` : '5 min break'}
            </span>
          </div>
          <div className={styles.stack}>
            <Field label="What are you studying?" htmlFor="focus-title">
              <TextInput
                id="focus-title"
                placeholder="e.g. Japanese restaurant phrases"
                value={f.title}
                disabled={f.startedAt !== null}
                onChange={(e) => update((s) => ({ ...s, focus: { ...s.focus, title: e.target.value } }))}
                maxLength={200}
              />
            </Field>
            <Field
              label="Focus duration (minutes)"
              htmlFor="focus-minutes"
              error={!durationValid ? 'Enter a positive whole number of minutes.' : undefined}
            >
              <TextInput
                id="focus-minutes"
                type="number"
                min={1}
                step={1}
                value={duration}
                disabled={f.startedAt !== null}
                aria-invalid={!durationValid || undefined}
                onChange={(e) => {
                  const value = e.target.value
                  setDurationDraft(value)
                  update((s) => ({ ...s, focus: setFocusMinutes(s.focus, Number(value)) }))
                }}
                onBlur={() => {
                  if (durationValid) setDurationDraft(null)
                }}
              />
            </Field>
            <Select
              aria-label="Pomodoro session"
              value={f.sessionId}
              disabled={f.startedAt !== null}
              onChange={(e) => update((s) => ({ ...s, focus: { ...s.focus, sessionId: e.target.value } }))}
              options={[
                { value: '', label: 'No session selected' },
                ...state.sessions.map((s) => ({ value: s.id, label: s.title })),
              ]}
            />
          </div>
          <div className={styles.timer}>
            <div
              className={styles.time}
              role="timer"
              aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
            >
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </div>
            {(finished || (f.startedAt !== null && !f.endsAt)) && (
              <p className="muted" role="status">
                {finished ? 'Time’s up' : 'Paused'}
              </p>
            )}
          </div>
          <div className={styles.timerActions}>
            {finished ? (
              <Button
                variant="primary"
                onClick={() => {
                  finishFocusSound(state.focusSoundEnabled)
                  setDurationDraft(null)
                  update((s) => stopFocus(s, Date.now()))
                }}
              >
                Finish
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  disabled={!f.endsAt && ((!f.title.trim() && f.mode === 'focus') || !durationValid)}
                  onClick={() => {
                    if (state.focusSoundEnabled) void unlockFocusAudio()
                    update((s) => toggleFocus(s, Date.now()))
                  }}
                >
                  {f.endsAt
                    ? 'Pause'
                    : f.startedAt
                      ? 'Resume'
                      : f.mode === 'break'
                        ? 'Start break'
                        : 'Start focus'}
                </Button>
                {f.startedAt !== null ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      stopFocusAlarm()
                      setDurationDraft(null)
                      update((s) => stopFocus(s, Date.now()))
                    }}
                  >
                    Reset
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDurationDraft(null)
                      update((s) => ({
                        ...s,
                        focus: freshFocus(
                          s.focus.mode === 'focus' ? 'break' : 'focus',
                          s.focus.title,
                          s.focus.sessionId,
                          s.focus.focusMinutes,
                        ),
                      }))
                    }}
                  >
                    {f.mode === 'focus' ? '5-min break' : 'Back to focus'}
                  </Button>
                )}
              </>
            )}
          </div>
          <div className={styles.cardFooter} style={{ marginTop: 20 }}>
            <label className="k-row">
              <Switch
                label="Completion jingle"
                checked={state.focusSoundEnabled}
                onChange={(enabled) => {
                  if (enabled) void unlockFocusAudio()
                  update((s) => ({ ...s, focusSoundEnabled: enabled }))
                }}
              />
              Completion jingle
            </label>
            <Button
              size="sm"
              variant="ghost"
              disabled={finished}
              onClick={async () => {
                const ready = await unlockFocusAudio()
                setSoundError(!ready || !playFocusJingle())
              }}
            >
              Test sound ♪
            </Button>
          </div>
          {soundError && (
            <p className="muted small" role="status">
              Sound is unavailable in this browser. The timer and focus history will still work.
            </p>
          )}
        </section>
      </div>
      <div className={`${styles.heading} ${styles.section}`}>
        <div className={styles.stats}>
          <strong>{reviewed}</strong>
          <span>cards reviewed today</span>
        </div>
        <div className={styles.stats}>
          <strong>
            {todayFocus.reduce((minutes, log) => minutes + log.focusSeconds / 60, 0)}
            <span className="small"> min</span>
          </strong>
          <span>focused today</span>
        </div>
      </div>
      {state.focusLog.length > 0 && (
        <section className={styles.section}>
          <div className={styles.heading}>
            <h2>Focus history</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Studied</th>
                  <th>Session</th>
                  <th>Completed</th>
                  <th>Focus time</th>
                </tr>
              </thead>
              <tbody>
                {[...state.focusLog].reverse().map((log) => (
                  <tr key={log.id}>
                    <td>{log.title}</td>
                    <td>{state.sessions.find((s) => s.id === log.sessionId)?.title ?? '—'}</td>
                    <td>{new Date(log.completedAt).toLocaleString()}</td>
                    <td>{log.durationMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <PreviewNote />
    </div>
  )
}
