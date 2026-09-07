import styles from '../voice.module.css'

type Props = { value: string; confidence?: number; onChange: (value: string) => void }

/** Ambiguous transcripts must be corrected before anything acts on them. */
export function TranscriptEditor({ value, confidence, onChange }: Props) {
  const low = confidence !== undefined && confidence < 0.8
  return (
    <div className={styles.transcript}>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} aria-label="Transcript" />
      <div className={styles.confidence} data-low={low}>
        <span>{confidence !== undefined ? `confidence ${(confidence * 100).toFixed(0)}%` : 'no confidence reported'}</span>
        <span>{low ? 'low confidence · please correct before routing' : 'edit if anything was misheard'}</span>
      </div>
    </div>
  )
}
