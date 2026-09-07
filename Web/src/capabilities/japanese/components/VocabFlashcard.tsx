import { useState } from 'react'
import type { VocabCard } from '../interfaces/types'
import styles from '../japanese.module.css'

export function VocabFlashcard({ cards }: { cards: VocabCard[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = cards[index]
  if (!card) return null
  const next = () => {
    setFlipped(false)
    window.setTimeout(() => setIndex((value) => (value + 1) % cards.length), 250)
  }
  return (
    <div className="k-stack">
      <button type="button" className={styles.flashcard} onClick={() => (flipped ? next() : setFlipped(true))} aria-label={flipped ? 'Next card' : 'Reveal'}>
        <div className={styles.flashInner} data-flipped={flipped}>
          <div className={styles.face}>
            <small>word of the day · {index + 1}/{cards.length}</small>
            <strong>{card.word}</strong>
            <small>tap to reveal</small>
          </div>
          <div className={`${styles.face} ${styles.back}`}>
            <small>{card.reading}</small>
            <strong>{card.meaning}</strong>
            <small>{card.example}</small>
          </div>
        </div>
      </button>
      <p className="muted small" style={{ textAlign: 'center' }}>
        Vocabulary recall is tracked separately from communication evidence. A word count never declares fluency.
      </p>
    </div>
  )
}
