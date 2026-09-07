import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../shared/ui/Button'
import { useLearn } from './useLearn'
import { addHighlight, artifactFromHighlight, uid, type Material, type Highlight } from './model'
import styles from './learn.module.css'

export function SourceReader({ source, onClose }: { source: Material; onClose?: () => void }) {
  const { state, update } = useLearn()
  const reader = useRef<HTMLDivElement>(null)
  const [passage, setPassage] = useState<Pick<Highlight, 'start' | 'end' | 'quote'> | null>(null)
  const [message, setMessage] = useState('')
  const highlights = state.highlights.filter((h) => h.sourceId === source.id)
  const boundaries = [
    ...new Set([0, source.content.length, ...highlights.flatMap((h) => [h.start, h.end])]),
  ].sort((a, b) => a - b)
  const selectPassage = () => {
    const selection = window.getSelection()
    if (!reader.current || !selection?.rangeCount || selection.isCollapsed) return
    const range = selection.getRangeAt(0)
    if (
      !reader.current.contains(range.startContainer) ||
      !reader.current.contains(range.endContainer)
    )
      return
    const prefix = range.cloneRange()
    prefix.selectNodeContents(reader.current)
    prefix.setEnd(range.startContainer, range.startOffset)
    const start = prefix.toString().length
    const quote = range.toString()
    if (!quote.trim()) return
    if (quote.length > 20000) {
      setPassage(null)
      setMessage('Select a shorter passage (up to 20,000 characters).')
      return
    }
    setPassage({ start, end: start + quote.length, quote })
    setMessage('')
  }
  const saveSelection = (createArtifact: boolean, at: number) => {
    if (!passage) return
    const id =
      highlights.find((h) => h.start === passage.start && h.end === passage.end)?.id ?? uid()
    const artifactId = uid()
    update((s) => {
      const next = addHighlight(s, {
        ...passage,
        id,
        sourceId: source.id,
        createdAt: at,
      })
      return createArtifact ? artifactFromHighlight(next, id, artifactId, at) : next
    })
    setPassage(null)
    window.getSelection()?.removeAllRanges()
    setMessage(
      createArtifact ? 'Artifact created with a link to this passage.' : 'Highlight saved.',
    )
  }
  const url =
    source.url || (/^https?:\/\/\S+$/i.test(source.content.trim()) ? source.content.trim() : '')
  const referenceOnly = url === source.content.trim()
  return (
    <section className={styles.sourceReader}>
      <header className={styles.sourceHeading}>
        <h2>{source.title}</h2>
      </header>
      <div className={styles.sourceBody}>
        <div className={styles.meta}>
          <span>{source.topic}</span>
          {url && /^https?:\/\//i.test(url) && (
            <a href={url} target="_blank" rel="noreferrer">
              Open original ↗
            </a>
          )}
          {source.route && (
            <Link to={`${source.route}?session=${source.sessionId}`} onClick={onClose}>
              Reference details ↗
            </Link>
          )}
        </div>
        {referenceOnly || !source.content.trim() ? (
          <p className="muted">
            This source contains a reference only. Add a source with pasted text to read and
            highlight it here.
          </p>
        ) : (
          <>
            <p className="muted small">
              Select a passage with your mouse or keyboard to highlight it or create an Artifact.
            </p>
            <div
              ref={reader}
              tabIndex={0}
              aria-label="Source text"
              className={styles.sourceText}
              onMouseUp={selectPassage}
              onKeyUp={selectPassage}
              onTouchEnd={selectPassage}
            >
              {boundaries.slice(0, -1).map((start, i) => {
                const end = boundaries[i + 1]
                const marked = highlights.some((h) => h.start <= start && h.end >= end)
                return marked ? (
                  <mark key={start}>{source.content.slice(start, end)}</mark>
                ) : (
                  <span key={start}>{source.content.slice(start, end)}</span>
                )
              })}
            </div>
            {passage && (
              <div className={styles.selectionBar}>
                <p className={styles.excerpt}>“{passage.quote}”</p>
                <div className={styles.meta}>
                  <Button onClick={() => saveSelection(false, Date.now())}>Save highlight</Button>
                  <Button variant="primary" onClick={() => saveSelection(true, Date.now())}>
                    Create artifact
                  </Button>
                  <Button variant="ghost" onClick={() => setPassage(null)}>
                    Clear selection
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        <p role="status" className="muted small">
          {message}
        </p>
        <details className={styles.sourceHighlights}>
          <summary>Highlights · {highlights.length}</summary>
          {highlights.map((h) => {
            const artifact = state.artifacts.find((a) => a.highlightId === h.id)
            return (
              <article key={h.id} className={styles.highlightRow}>
                <blockquote className={styles.excerpt}>{h.quote}</blockquote>
                {artifact ? (
                  <Link to={`/learn/artifacts?session=${artifact.sessionId}`} onClick={onClose}>
                    View artifact ↗
                  </Link>
                ) : (
                  <Button
                    onClick={() => {
                      const id = uid(),
                        at = Date.now()
                      update((s) => artifactFromHighlight(s, h.id, id, at))
                      setMessage('Artifact created with a link to this passage.')
                    }}
                  >
                    Create artifact
                  </Button>
                )}
              </article>
            )
          })}
        </details>
      </div>
    </section>
  )
}
