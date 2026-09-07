import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../shared/ui/Button'
import { LifecycleTrail } from '../../../shared/ui/LifecycleTrail'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { useToast } from '../../../shared/ui/useToast'
import { confirmProposal, refreshProposal } from '../interfaces/assistantApi'
import type { ActionProposal } from '../interfaces/types'
import { ProposalConfirmDialog } from './ProposalConfirmDialog'
import styles from '../assistant.module.css'

const steps = [
  { id: 'ready_for_review', label: 'review' },
  { id: 'confirmed', label: 'confirmed' },
  { id: 'executing', label: 'executing' },
  { id: 'completed', label: 'completed' },
]

type Props = { proposal: ActionProposal; onChange: (proposal: ActionProposal) => void }

export function ProposalCard({ proposal, onChange }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const exception = ['expired', 'superseded', 'failed', 'unknown_outcome'].includes(proposal.status)

  const confirm = async () => {
    setBusy(true)
    onChange({ ...proposal, status: 'confirmed' })
    const result = await confirmProposal(proposal.id, proposal.version)
    setBusy(false)
    setConfirming(false)
    if (result.status === 'completed') {
      onChange(result.value)
      toast(result.value.resultLabel ?? 'Action completed')
    } else if (result.status === 'failed') {
      onChange({ ...proposal, status: result.code === 'expired' ? 'expired' : result.code === 'superseded' ? 'superseded' : 'failed' })
      toast(result.message ?? 'Action failed', { tone: 'danger' })
    }
  }

  const refresh = async () => {
    setBusy(true)
    const result = await refreshProposal(proposal.id)
    setBusy(false)
    if (result.status === 'completed') onChange(result.value)
  }

  return (
    <div className={styles.proposal}>
      <div className={styles.proposalHead}>
        <span className="label">
          proposed action · <span style={{ color: 'var(--accent)' }}>{proposal.tool}</span> · v{proposal.version}
        </span>
        <StatusPill tone={proposal.classification === 'write' ? 'accent' : 'neutral'}>{proposal.classification}</StatusPill>
      </div>
      <p className={styles.proposalPreview}>{proposal.preview}</p>
      <LifecycleTrail steps={steps} current={proposal.status} exception={exception ? { label: proposal.status.replace('_', ' '), tone: proposal.status === 'failed' ? 'failed' : 'warn' } : undefined} />
      <div className="k-row k-row--between">
        <span className="muted small">requires {proposal.requiredScopes.join(', ')}</span>
        <div className="k-row">
          {proposal.status === 'ready_for_review' ? (
            <Button size="sm" variant="primary" onClick={() => setConfirming(true)}>
              Review and confirm
            </Button>
          ) : null}
          {exception ? (
            <Button size="sm" icon="refresh" onClick={refresh} busy={busy}>
              Fresh preview
            </Button>
          ) : null}
          {proposal.status === 'completed' && proposal.resultRoute ? (
            <Link to={proposal.resultRoute} className="k-ref">
              {proposal.resultLabel ?? 'open result'} →
            </Link>
          ) : null}
        </div>
      </div>
      <ProposalConfirmDialog proposal={confirming ? proposal : null} busy={busy} onConfirm={confirm} onClose={() => setConfirming(false)} />
    </div>
  )
}
