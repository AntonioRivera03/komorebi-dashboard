import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { daysUntil, formatLongDay } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import type { Exam } from '../interfaces/types'
import styles from '../exams.module.css'

export function ExamCard({ exam }: { exam: Exam }) {
  const days = daysUntil(exam.date)
  const coverage = exam.topics.reduce((sum, topic) => sum + topic.coverage * topic.weight, 0) / Math.max(1, exam.topics.reduce((sum, topic) => sum + topic.weight, 0))
  return (
    <Link to={`${routes.exams}/${exam.id}`} className={styles.card}>
      <div className="k-row k-row--between">
        <StatusPill tone={days <= 10 ? 'warn' : 'neutral'}>{formatLongDay(exam.date)}</StatusPill>
        <span className="muted small mono">
          blueprint r{exam.blueprintRevision} · rubric r{exam.rubricRevision}
        </span>
      </div>
      <h3>{exam.title}</h3>
      <div className={styles.countdown}>
        {days}
        <small>DAYS</small>
      </div>
      <div className={styles.weights} aria-label="Topic weights">
        {exam.topics.map((topic) => (
          <span key={topic.id} style={{ width: `${topic.weight}%` }} title={`${topic.name} ${topic.weight}%`} />
        ))}
      </div>
      <span className="muted small">
        weighted coverage {Math.round(coverage * 100)}% · {exam.runs.length} practice runs · {exam.errors.filter((error) => !error.repair).length} unrepaired mistakes
      </span>
    </Link>
  )
}
