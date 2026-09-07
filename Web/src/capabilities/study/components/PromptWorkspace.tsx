import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextArea } from '../../../shared/ui/TextArea'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Link } from 'react-router'
import { routes } from '../../../shared/lib/routes'
import type { Assistance, Attempt, Prompt } from '../interfaces/types'
import { AssessmentCard } from './AssessmentCard'
import styles from '../study.module.css'

type Props = {
  prompt: Prompt
  attempt: Attempt | null
  busy: boolean
  readOnly: boolean
  onSubmit: (answer: string, assistance: Assistance) => void
  onSelfAssess: (score: number) => void
  onAskFeedback: () => void
}

/** Answer before revealing; the answer is saved before any feedback request. */
export function PromptWorkspace({ prompt, attempt, busy, readOnly, onSubmit, onSelfAssess, onAskFeedback }: Props) {
  const [answer, setAnswer] = useState('')
  const [assistance, setAssistance] = useState<Assistance>('independent')
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setAnswer(attempt?.answer ?? '')
    setAssistance(attempt?.assistance ?? 'independent')
    setRevealed(Boolean(attempt))
  }, [prompt.id, attempt])

  const selfScore = attempt?.assessments.find((item) => item.provenance === 'self')?.score
  const aiPending = attempt?.assessments.some((item) => item.provenance === 'ai_draft' && item.state === 'pending')

  return (
    <div className={styles.promptCard}>
      <div className="k-row k-row--between">
        <StatusPill tone="soft">{prompt.kind}</StatusPill>
        <span className="mono small muted">
          {prompt.id} · r{prompt.revision} ·{' '}
          {prompt.sourceRefs.map((ref, index) => (
            <span key={ref.locator}>
              {index > 0 ? ', ' : ''}
              <Link to={`${routes.library}/${ref.sourceId}`}>{ref.locator}</Link>
            </span>
          ))}
        </span>
      </div>
      <p className={styles.question}>{prompt.question}</p>
      <div className={`${styles.answer} k-stack`}>
        <TextArea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Answer from memory first. Reveal after." readOnly={Boolean(attempt) || readOnly} aria-label="Your answer" />
        {!attempt ? (
          <div className="k-row k-row--between">
            <SegmentedControl<Assistance> label="Assistance used" value={assistance} onChange={setAssistance} options={[{ value: 'independent', label: 'Independent' }, { value: 'hint', label: 'Used a hint' }, { value: 'reference', label: 'Looked at reference' }]} />
            <Button variant="primary" busy={busy} disabled={!answer.trim() || readOnly} onClick={() => onSubmit(answer, assistance)}>
              Save answer and reveal
            </Button>
          </div>
        ) : (
          <span className="muted small">
            Saved {new Date(attempt.submittedAt).toLocaleTimeString()} · {attempt.assistance} · a correction appends a new attempt; originals are preserved.
          </span>
        )}
      </div>
      {revealed && attempt ? (
        <div className={styles.reveal}>
          <span className="label">Reference answer</span>
          <p className={styles.reference}>{prompt.referenceAnswer ?? 'No reference answer approved for this prompt.'}</p>
          <div className="k-row k-row--between">
            <div className="k-row">
              <span className="label">Self-assess</span>
              <div className={styles.score} role="group" aria-label="Self assessment">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button key={score} type="button" aria-pressed={selfScore === score} onClick={() => onSelfAssess(score)} disabled={selfScore !== undefined}>
                    {score}
                  </button>
                ))}
              </div>
            </div>
            <Button icon="sparkle" onClick={onAskFeedback} busy={aiPending} disabled={attempt.assessments.some((item) => item.provenance === 'ai_draft' && item.state === 'completed')}>
              Ask for AI feedback
            </Button>
          </div>
          {attempt.assessments
            .filter((item) => item.provenance !== 'self')
            .map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} onRetry={onAskFeedback} />
            ))}
        </div>
      ) : null}
    </div>
  )
}
