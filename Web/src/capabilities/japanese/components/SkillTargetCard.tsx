import { Link } from 'react-router'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { ProgressBar } from '../../../shared/ui/ProgressBar'
import { formatRelative } from '../../../shared/lib/format'
import type { SkillMode, SkillTarget } from '../interfaces/types'
import styles from '../japanese.module.css'

type Props = { target: SkillTarget; onPractice: (target: SkillTarget, mode: SkillMode) => void; micBlocked: boolean }

const modeIcon: Record<SkillMode, IconName> = { listening: 'bell', reading: 'book', writing: 'edit', speaking: 'mic' }

export function SkillTargetCard({ target, onPractice, micBlocked }: Props) {
  return (
    <article className={styles.target}>
      <div className="k-row k-row--between">
        <StatusPill tone="soft">target {target.level}</StatusPill>
        {target.assessment ? <StatusPill tone="ok">{target.assessment.level}</StatusPill> : <StatusPill>no assessed evidence</StatusPill>}
      </div>
      <h3>{target.title}</h3>
      <p className="muted" style={{ fontSize: 12 }}>
        {target.purpose}
      </p>
      <div className={styles.split}>
        <div className={styles.splitCell}>
          <span className="label">communication evidence</span>
          <strong>{target.evidence.filter((item) => item.outcome === 'met').length}</strong>
          <span className="muted small">
            attempts met · {target.evidence.filter((item) => item.assistance === 'independent').length} independent
          </span>
        </div>
        <div className={styles.splitCell}>
          <span className="label">vocabulary recall</span>
          <strong>{Math.round((target.vocabularyRecall ?? 0) * 100)}%</strong>
          <ProgressBar value={(target.vocabularyRecall ?? 0) * 100} tone="muted" label="Vocabulary recall" />
        </div>
      </div>
      {target.evidence.length ? (
        <div className={styles.evidence}>
          {target.evidence.map((item) => (
            <span key={item.attemptId} className={styles.evidenceChip} data-outcome={item.outcome}>
              <span>
                {item.mode} · {item.outcome.replace('_', ' ')}
              </span>
              <span>
                {item.assistance} · {formatRelative(item.at)}
              </span>
            </span>
          ))}
        </div>
      ) : null}
      {target.assessment ? (
        <p style={{ fontSize: 12, lineHeight: 1.5 }}>
          {target.assessment.note} <span className="muted small">— basis: {target.assessment.basis}</span>
        </p>
      ) : null}
      <div className="k-row k-row--between">
        <div className={styles.modes} role="group" aria-label="Practise">
          {target.modes.map((mode) => (
            <button key={mode} type="button" className={styles.modeBtn} onClick={() => onPractice(target, mode)} disabled={mode === 'speaking' && micBlocked} title={mode === 'speaking' && micBlocked ? 'Microphone unavailable; text practice still works' : undefined}>
              <Icon name={modeIcon[mode]} size={12} /> {mode}
            </button>
          ))}
        </div>
        <div className="k-row">
          {target.lessonRefs.map((ref) => (
            <Link key={ref.locator} to={ref.route} className="k-ref">
              <span className="k-ref__owner">{ref.title}</span> · {ref.locator}
            </Link>
          ))}
        </div>
      </div>
    </article>
  )
}
