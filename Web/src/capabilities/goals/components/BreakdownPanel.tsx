import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { Notice } from '../../../shared/ui/Notice'
import type { BreakdownSuggestion } from '../interfaces/types'
import styles from '../goals.module.css'

type Props = {
  open: boolean
  state: 'idle' | 'loading' | 'ready' | 'failed'
  suggestions: BreakdownSuggestion[] | null
  onClose: () => void
  onRequest: () => void
  onAccept: (suggestion: BreakdownSuggestion) => void
  onReject: (suggestion: BreakdownSuggestion) => void
}

/** AI develops milestones and next actions; suggestions stay separate until accepted. */
export function BreakdownPanel({ open, state, suggestions, onClose, onRequest, onAccept, onReject }: Props) {
  return (
    <SidePanel
      open={open}
      onClose={onClose}
      eyebrow="AI breakdown · drafts only"
      title="Break it down"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button icon="sparkle" variant="primary" onClick={onRequest} busy={state === 'loading'}>
            {suggestions ? 'Suggest again' : 'Suggest milestones and actions'}
          </Button>
        </>
      }
    >
      <Notice glyph="✦">Uses the selected goal, its constraints and relevant persistent context. Accepting a task issues Tasks.createTask and links the returned reference; nothing is created until you accept.</Notice>
      <div className="k-stack" style={{ marginTop: 16 }}>
        {state === 'loading' ? <Skeleton lines={4} /> : null}
        {state === 'failed' ? <Notice tone="danger" glyph="!">The model request failed. The manual editor still works.</Notice> : null}
        {suggestions?.map((suggestion) => (
          <div key={suggestion.id} className={styles.suggestion} data-decision={suggestion.decision}>
            <div className="k-row k-row--between">
              <StatusPill tone={suggestion.kind === 'milestone' ? 'accent' : 'soft'}>{suggestion.kind}</StatusPill>
              {suggestion.decision ? <span className="muted small mono">{suggestion.decision}</span> : null}
            </div>
            <strong style={{ fontWeight: 500, fontSize: 13 }}>{suggestion.title}</strong>
            <span className="muted small">{suggestion.rationale}</span>
            {!suggestion.decision ? (
              <div className="k-row">
                <Button size="sm" variant="primary" onClick={() => onAccept(suggestion)}>
                  Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onReject(suggestion)}>
                  Reject
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </SidePanel>
  )
}
