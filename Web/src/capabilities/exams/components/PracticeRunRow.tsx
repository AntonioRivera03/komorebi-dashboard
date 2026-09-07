import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import type { PracticeRun } from '../interfaces/types'
import styles from '../exams.module.css'

type Props = { run: PracticeRun; onReview: (run: PracticeRun) => void; busy?: boolean }

export function PracticeRunRow({ run, onReview, busy }: Props) {
  return (
    <div className={styles.run}>
      <div>
        <Link to={`${routes.practice}/${run.sessionRef}`} style={{ fontWeight: 500 }}>
          {run.timed ? `Timed · ${run.durationMinutes} min` : 'Untimed'} practice
        </Link>
        <small>
          {formatRelative(run.startedAt)} · blueprint r{run.blueprintRevision} · rubric r{run.rubricRevision} · session {run.sessionRef}
        </small>
      </div>
      <div className="k-row">
        {run.status === 'assessed' ? (
          <StatusPill tone={run.reviewed ? 'ok' : 'warn'}>
            {run.score}/{run.maxScore} · {run.reviewed ? 'reviewed' : 'AI draft'}
          </StatusPill>
        ) : run.status === 'awaiting_marking' ? (
          <>
            <StatusPill tone="warn" live>
              marking pending
            </StatusPill>
            <Button size="sm" onClick={() => onReview(run)} busy={busy}>
              Review marking
            </Button>
          </>
        ) : (
          <StatusPill tone="accent" live>
            in progress
          </StatusPill>
        )}
      </div>
    </div>
  )
}
