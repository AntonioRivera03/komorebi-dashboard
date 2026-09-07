import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Notice } from '../../../shared/ui/Notice'
import type { Goal } from '../interfaces/types'
import styles from '../goals.module.css'

type Props = { goal: Goal | null; busy?: boolean; onConfirm: () => void; onClose: () => void }

/** Completing linked tasks never proves the goal; achievement is the user's declaration. */
export function DeclareAchievedDialog({ goal, busy, onConfirm, onClose }: Props) {
  const openActions = goal?.actions.filter((item) => item.status === 'open' || item.status === 'in_progress').length ?? 0
  return (
    <Dialog
      open={goal !== null}
      onClose={onClose}
      eyebrow="Your declaration, not a computed result"
      title="Declare this goal achieved?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Not yet
          </Button>
          <Button variant="primary" onClick={onConfirm} busy={busy}>
            Declare achieved
          </Button>
        </>
      }
    >
      {goal ? (
        <div className={styles.declare}>
          <span className="label">Evidence definition</span>
          <p style={{ fontSize: 13 }}>{goal.evidenceDefinition || 'No evidence definition was written.'}</p>
          <span className="label">Collected evidence</span>
          <p className="muted small">
            {goal.evidence.filter((item) => item.available).length} available · {goal.evidence.filter((item) => !item.available).length} removed
          </p>
          {openActions > 0 ? <Notice tone="warn" glyph="!">{openActions} linked action{openActions === 1 ? '' : 's'} still open. They stay open; declaring the goal does not complete them.</Notice> : null}
        </div>
      ) : null}
    </Dialog>
  )
}
