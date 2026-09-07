import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { ResourceChip } from '../../../shared/ui/ResourceChip'
import type { ActionProposal } from '../interfaces/types'
import styles from '../assistant.module.css'

type Props = { proposal: ActionProposal | null; busy?: boolean; onConfirm: () => void; onClose: () => void }

/** Confirmation applies to one immutable proposal version. */
export function ProposalConfirmDialog({ proposal, busy, onConfirm, onClose }: Props) {
  return (
    <Dialog
      open={proposal !== null}
      onClose={onClose}
      eyebrow={proposal ? `${proposal.tool} · v${proposal.toolVersion} · proposal version ${proposal.version}` : ''}
      title="Confirm exactly this change"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button variant="primary" onClick={onConfirm} busy={busy}>
            Confirm version {proposal?.version}
          </Button>
        </>
      }
    >
      {proposal ? (
        <div className="k-stack">
          <p className={styles.proposalPreview}>{proposal.preview}</p>
          <dl className={styles.args}>
            {Object.entries(proposal.args).map(([key, value]) => (
              <div key={key} style={{ display: 'contents' }}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <span className="label">Revisions this preview depends on</span>
          <div className="k-row">
            {proposal.sourceRevisions.map((ref) => (
              <ResourceChip key={`${ref.owner}-${ref.id}`} resource={ref} />
            ))}
          </div>
          <p className="muted small">
            Scopes rechecked at execution: {proposal.requiredScopes.join(', ')}. If any revision changed, you will get a new preview instead of a silent reinterpretation. Expires {new Date(proposal.expiresAt).toLocaleTimeString()}.
          </p>
        </div>
      ) : null}
    </Dialog>
  )
}
