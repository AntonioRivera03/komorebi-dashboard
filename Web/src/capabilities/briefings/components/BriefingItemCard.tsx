import { Button } from '../../../shared/ui/Button'
import { Popover } from '../../../shared/ui/Popover'
import { MenuItem } from '../../../shared/ui/MenuItem'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { BriefingItem } from '../interfaces/types'
import styles from '../briefings.module.css'

type Props = { item: BriefingItem; onMute: (kind: 'source' | 'topic', value: string) => void; onCapture: (item: BriefingItem) => void }

export function BriefingItemCard({ item, onMute, onCapture }: Props) {
  return (
    <article className={styles.item} data-kind={item.kind}>
      <div className="k-row k-row--between">
        <div className="k-row">
          <StatusPill tone={item.generated ? 'warn' : item.kind === 'weather' || item.kind === 'calendar' ? 'accent' : 'neutral'}>{item.generated ? 'generated synthesis' : item.kind}</StatusPill>
          {item.topic ? <StatusPill tone="soft">{item.topic}</StatusPill> : null}
        </div>
        <Popover align="right" width={260} title="why this appeared" trigger={(props) => <button type="button" className="k-btn k-btn--ghost k-btn--sm" {...props}>why?</button>}>
          <p style={{ fontSize: 11, lineHeight: 1.5, padding: '4px 8px' }}>{item.why}</p>
        </Popover>
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className={styles.source}>
        <span>
          {item.source.url ? (
            <a href={item.source.url} target="_blank" rel="noreferrer">
              {item.source.name}
            </a>
          ) : (
            item.source.name
          )}
        </span>
        {item.source.publishedAt ? <span>published {formatRelative(item.source.publishedAt)}</span> : null}
        <span>observed {formatRelative(item.source.observedAt)}</span>
        {!item.generated ? (
          <span className="k-row" style={{ marginLeft: 'auto', gap: 4 }}>
            <Button size="sm" variant="ghost" onClick={() => onCapture(item)}>
              Capture
            </Button>
            <Popover align="right" title="Mute" trigger={(props) => <Button size="sm" variant="ghost" {...props}>Mute</Button>}>
              {(close) => (
                <>
                  <MenuItem onClick={() => { onMute('source', item.source.name); close() }}>Source · {item.source.name}</MenuItem>
                  {item.topic ? <MenuItem onClick={() => { onMute('topic', item.topic as string); close() }}>Topic · {item.topic}</MenuItem> : null}
                </>
              )}
            </Popover>
          </span>
        ) : null}
      </div>
    </article>
  )
}
