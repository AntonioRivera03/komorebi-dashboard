import type { SyllabusTopic } from '../interfaces/types'
import styles from '../exams.module.css'

/** Coverage (prompts exist) and performance (reviewed results) are distinct measures. */
export function TopicCoverageTable({ topics }: { topics: SyllabusTopic[] }) {
  return (
    <div>
      <div className={styles.topicHead}>
        <span>topic</span>
        <span>weight</span>
        <span>coverage</span>
        <span>performance</span>
      </div>
      {topics.map((topic) => (
        <div key={topic.id} className={styles.topic}>
          <div>
            <strong style={{ fontWeight: 500 }}>{topic.name}</strong>
            <div className="muted small mono">
              {topic.promptCount} prompts · {topic.sourceCount} sources
            </div>
          </div>
          <span className="mono">{topic.weight}%</span>
          <div className={styles.bars}>
            <div className={styles.bar}>
              <span style={{ width: `${topic.coverage * 100}%` }} />
            </div>
            <span className="muted small mono">{Math.round(topic.coverage * 100)}%</span>
          </div>
          <div className={styles.bars}>
            <div className={styles.bar} data-kind="performance" data-none={topic.performance === undefined}>
              {topic.performance !== undefined ? <span style={{ width: `${topic.performance * 100}%` }} /> : null}
            </div>
            <span className="muted small mono">{topic.performance !== undefined ? `${Math.round(topic.performance * 100)}% reviewed` : 'no reviewed result'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
