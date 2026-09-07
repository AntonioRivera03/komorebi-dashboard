import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { Assessment } from '../interfaces/types'
import styles from '../study.module.css'

type Props = { assessment: Assessment; onRetry?: () => void }

const labels = { self: 'self-assessed', deterministic: 'deterministic', ai_draft: 'AI draft · unreviewed', human_reviewed: 'reviewed' }

export function AssessmentCard({ assessment, onRetry }: Props) {
  const pending = assessment.state === 'pending'
  return (
    <div className={styles.assessment} data-pending={pending}>
      <div className="k-row k-row--between">
        <StatusPill tone={assessment.provenance === 'human_reviewed' ? 'ok' : assessment.provenance === 'ai_draft' ? 'warn' : 'neutral'} live={pending}>
          {labels[assessment.provenance]}
        </StatusPill>
        {assessment.score !== undefined ? (
          <span className="mono">
            {assessment.score}/{assessment.maxScore}
          </span>
        ) : null}
      </div>
      {pending ? <span className="muted">Comparing your saved answer with the reference…</span> : null}
      {assessment.state === 'failed' ? (
        <div className="k-row k-row--between">
          <span style={{ color: 'var(--danger)' }}>{assessment.error}</span>
          {onRetry ? (
            <Button size="sm" icon="refresh" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      {assessment.feedback ? <p>{assessment.feedback}</p> : null}
      {assessment.citedLocators?.length ? <span className="mono small muted">cites {assessment.citedLocators.join(', ')}</span> : null}
    </div>
  )
}
