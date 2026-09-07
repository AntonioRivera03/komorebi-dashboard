import type { CSSProperties, MouseEvent } from 'react'
import { formatTime } from '../../../shared/lib/format'
import type { AgendaItem } from '../interfaces/types'
import styles from '../calendar.module.css'

type Props = { item: AgendaItem; style?: CSSProperties; compact?: boolean; onSelect: (item: AgendaItem) => void }

export function AgendaItemChip({ item, style, compact, onSelect }: Props) {
  return (
    <button
      type="button"
      className={styles.item}
      style={compact ? { position: 'static', padding: '2px 6px' } : style}
      data-kind={item.kind}
      data-lifecycle={item.lifecycle}
      data-conflict={Boolean(item.conflict)}
      onClick={(event: MouseEvent) => {
        event.stopPropagation()
        onSelect(item)
      }}
      title={`${item.title}${item.conflict ? ` · ${item.conflict}` : ''}`}
    >
      <strong>{item.title}</strong>
      {!compact ? (
        <small>
          {formatTime(item.start)}–{formatTime(item.end)}
          {item.kind === 'block' ? ` · ${item.lifecycle}` : item.calendar ? ` · ${item.calendar}` : ''}
        </small>
      ) : null}
    </button>
  )
}
