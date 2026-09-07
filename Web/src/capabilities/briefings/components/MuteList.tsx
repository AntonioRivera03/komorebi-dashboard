import { Tag } from '../../../shared/ui/Tag'
import type { BriefingSnapshot } from '../interfaces/types'
import styles from '../briefings.module.css'

type Props = { muted: BriefingSnapshot['muted']; onUnmute: (kind: 'source' | 'topic', value: string) => void }

export function MuteList({ muted, onUnmute }: Props) {
  if (muted.length === 0) return <p className="muted small">Nothing muted.</p>
  return (
    <div className={styles.mutes}>
      {muted.map((rule) => (
        <Tag key={`${rule.kind}-${rule.value}`} outline onRemove={() => onUnmute(rule.kind, rule.value)}>
          {rule.kind} · {rule.value}
        </Tag>
      ))}
    </div>
  )
}
