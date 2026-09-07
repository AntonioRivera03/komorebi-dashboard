import styles from '../knowledge.module.css'

export function OpenQuestionList({ questions }: { questions: string[] }) {
  if (questions.length === 0) return <p className="muted small">No open questions marked.</p>
  return (
    <div className="k-stack" style={{ gap: 8 }}>
      {questions.map((question) => (
        <div key={question} className={styles.question}>
          <span aria-hidden="true">?</span>
          <span>{question}</span>
        </div>
      ))}
    </div>
  )
}
