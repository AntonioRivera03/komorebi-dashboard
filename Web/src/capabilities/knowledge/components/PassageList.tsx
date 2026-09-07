import type { SourceChunk } from '../interfaces/types'
import styles from '../knowledge.module.css'

type Props = { chunks: SourceChunk[]; activeLocator?: string; onSelect?: (chunk: SourceChunk) => void }

/** Extracted passages with stable locators; displayed separately from the original. */
export function PassageList({ chunks, activeLocator, onSelect }: Props) {
  if (chunks.length === 0) return <p className="muted small">No passages for this revision yet.</p>
  return (
    <div>
      {chunks.map((chunk) => (
        <div key={chunk.id} className={styles.passage} data-active={chunk.locator === activeLocator} id={`loc-${chunk.id}`} onClick={() => onSelect?.(chunk)} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}>
          <div className={styles.locator}>
            {chunk.locator}
            <small>
              r{chunk.revision} · {chunk.hash}
            </small>
          </div>
          <p className={styles.passageText}>{chunk.text}</p>
        </div>
      ))}
    </div>
  )
}
