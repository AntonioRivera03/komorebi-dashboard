import { Button } from '../../../shared/ui/Button'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { Prompt } from '../interfaces/types'
import styles from '../study.module.css'

type Props = { prompt: Prompt; selected: boolean; onSelect: (id: string) => void; onApprove: (id: string) => void }

export function PromptRow({ prompt, selected, onSelect, onApprove }: Props) {
  const tone = prompt.status === 'approved' ? 'ok' : prompt.status === 'draft' ? 'warn' : prompt.status === 'flagged' ? 'danger' : 'neutral'
  return (
    <div className={styles.promptRow}>
      <label className="k-row" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
        <Checkbox checked={selected} disabled={prompt.status !== 'approved'} onChange={() => onSelect(prompt.id)} aria-label={`Select ${prompt.question}`} style={{ marginTop: 3 }} />
        <div>
          <q>{prompt.question}</q>
          <div className="k-row" style={{ marginTop: 6, gap: 6 }}>
            <StatusPill tone={tone}>{prompt.status}</StatusPill>
            <StatusPill tone="soft">{prompt.kind}</StatusPill>
            <span className="mono small muted">
              r{prompt.revision} · {prompt.generatedBy === 'ai' ? 'AI draft' : 'yours'} · {prompt.sourceRefs.map((ref) => ref.locator).join(', ')}
            </span>
          </div>
          {prompt.flaggedReason ? <p className="small" style={{ color: 'var(--danger)', marginTop: 4 }}>{prompt.flaggedReason}</p> : null}
        </div>
      </label>
      {prompt.status === 'draft' ? (
        <Button size="sm" onClick={() => onApprove(prompt.id)} icon="check">
          Approve
        </Button>
      ) : null}
    </div>
  )
}
