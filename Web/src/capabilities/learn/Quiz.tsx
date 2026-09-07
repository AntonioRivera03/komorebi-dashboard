import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { TextArea } from '../../shared/ui/TextArea'
import { TextInput } from '../../shared/ui/TextInput'
import { useLearn } from './useLearn'
import { quizFromCards, uid, type Material } from './model'
import styles from './learn.module.css'

export function QuizComposer({ cardIds, onClose }: { cardIds: string[]; onClose: () => void }) {
  const { state, update } = useLearn()
  const navigate = useNavigate()
  const [title, setTitle] = useState('Flashcard quiz')
  const [error, setError] = useState('')
  return (
    <Dialog open title="Create quiz from flashcards" onClose={onClose} wide>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          try {
            const quiz = quizFromCards(state, cardIds, uid(), title)
            update((s) => ({ ...s, materials: [...s.materials, quiz] }))
            onClose()
            navigate(`/learn/sessions/${quiz.sessionId}?section=Quizzes`)
          } catch (err) {
            setError((err as Error).message)
          }
        }}
      >
        <Field label="Quiz title" htmlFor="quiz-title">
          <TextInput
            id="quiz-title"
            required
            maxLength={300}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <p className="muted small">
          {cardIds.length} questions. The front becomes the question and the back becomes the
          reference answer. Your cards and review schedule are preserved.
        </p>
        {cardIds.map((id, i) => {
          const card = state.cards.find((c) => c.id === id)
          return (
            card && (
              <article key={id} className={styles.artifact}>
                <strong>
                  {i + 1}. {card.front}
                </strong>
                <p>{card.back}</p>
              </article>
            )
          )
        })}
        {error && <p role="alert">{error}</p>}
        <div className={styles.cardFooter}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Create quiz
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function QuizPlayer({ quiz, onClose }: { quiz: Material; onClose: () => void }) {
  const { state, update } = useLearn()
  const questions = quiz.questions ?? [
    { id: quiz.id, front: quiz.content, back: quiz.answer ?? '' },
  ]
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attemptId, setAttemptId] = useState(uid)
  const [submitted, setSubmitted] = useState(false)
  const history = state.quizAttempts.filter((a) => a.quizId === quiz.id)
  return (
    <Dialog open title={quiz.title} onClose={onClose} wide>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          if (submitted || questions.some((q) => !answers[q.id]?.trim())) return
          const at = Date.now()
          update((s) =>
            s.quizAttempts.some((a) => a.id === attemptId)
              ? s
              : {
                  ...s,
                  quizAttempts: [
                    ...s.quizAttempts,
                    { id: attemptId, quizId: quiz.id, at, questions, answers },
                  ],
                },
          )
          setSubmitted(true)
        }}
      >
        {questions.map((q, i) => (
          <article key={q.id} className={styles.artifact}>
            <Field label={`${i + 1}. ${q.front}`} htmlFor={`quiz-answer-${q.id}`}>
              <TextArea
                id={`quiz-answer-${q.id}`}
                required
                maxLength={20000}
                rows={3}
                disabled={submitted}
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            </Field>
            {submitted && (
              <>
                <span className="label">Reference answer</span>
                <p>{q.back}</p>
              </>
            )}
          </article>
        ))}
        {submitted ? (
          <>
            <p role="status" className="muted">
              Attempt recorded. Compare your answers with the references; this does not change your
              flashcard schedule.
            </p>
            <Button
              onClick={() => {
                setAnswers({})
                setAttemptId(uid())
                setSubmitted(false)
              }}
            >
              Try again
            </Button>
          </>
        ) : (
          <Button type="submit" variant="primary">
            Save attempt & reveal answers
          </Button>
        )}
        {!!history.length && (
          <details>
            <summary>Previous attempts · {history.length}</summary>
            {[...history].reverse().map((a) => (
              <article key={a.id} className={styles.artifact}>
                <span className="muted small">{new Date(a.at).toLocaleString()}</span>
                {a.questions.map((q) => (
                  <div key={q.id}>
                    <strong>{q.front}</strong>
                    <p>{a.answers[q.id]}</p>
                    <p className="muted">Reference: {q.back}</p>
                  </div>
                ))}
              </article>
            ))}
          </details>
        )}
      </form>
    </Dialog>
  )
}
