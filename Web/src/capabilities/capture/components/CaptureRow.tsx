import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { CaptureItem } from '../interfaces/types'
import styles from '../capture.module.css'

const glyphs = { text: '❝', url: '⌁', file: '▤' } as const

type Props = { item: CaptureItem; onOpen: (item: CaptureItem) => void }

export function CaptureRow({ item, onOpen }: Props) {
  const suggestion = item.suggestion
  return (
    <div className={styles.row} role="button" tabIndex={0} onClick={() => onOpen(item)} onKeyDown={(event) => event.key === 'Enter' && onOpen(item)}>
      <span className={styles.glyph} aria-hidden="true">
        {glyphs[item.kind]}
      </span>
      <div>
        <p className={styles.body}>{item.body}</p>
        <div className={styles.meta}>
          <span>{formatRelative(item.createdAt)}</span>
          <span>via {item.origin}</span>
          {item.attachmentRefs.length ? <span>{item.attachmentRefs.length} attachment</span> : null}
          {item.transcriptRef ? <span>transcript {item.transcriptRef}</span> : null}
        </div>
      </div>
      <div className="k-row">
        {item.conversion?.status === 'failed' ? <StatusPill tone="danger">conversion failed</StatusPill> : null}
        {item.conversion?.status === 'pending' ? <StatusPill tone="warn" live>converting</StatusPill> : null}
        {item.conversion?.status === 'completed' ? <StatusPill tone="ok">→ {item.conversion.destinationKind}</StatusPill> : null}
        {suggestion && 'status' in suggestion && suggestion.status === 'pending' ? <StatusPill live>thinking</StatusPill> : null}
        {suggestion && 'destination' in suggestion && !suggestion.decision && item.state === 'unprocessed' ? <StatusPill tone="accent">suggests {suggestion.destination}</StatusPill> : null}
      </div>
    </div>
  )
}
