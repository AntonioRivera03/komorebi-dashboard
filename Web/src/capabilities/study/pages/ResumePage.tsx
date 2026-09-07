import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useResumeCandidates } from '../interfaces/useResumeCandidates'
import { resolveCheckpoint, resumeFromCheckpoint } from '../interfaces/studyApi'
import { CheckpointCard } from '../components/CheckpointCard'

export default function ResumePage() {
  const candidates = useResumeCandidates()
  const navigate = useNavigate()
  const toast = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  return (
    <div className="k-page">
      <PageHeader eyebrow="Study · L07" title="Return tickets" subtitle="Where you left off, what was unclear and the next useful step. Paused interests never become overdue work." />
      <div className="k-grid k-grid--sidebar">
        <AsyncPanel query={candidates} isEmpty={(data) => data.length === 0} empty={<EmptyState glyph="⟲" title="No checkpoints">End or pause a session with a short note and it appears here and on Today.</EmptyState>} skeletonLines={6}>
          {({ data }) => (
            <div className="k-grid k-grid--cards" style={{ gridTemplateColumns: '1fr' }}>
              {data.map((checkpoint) => (
                <CheckpointCard
                  key={checkpoint.id}
                  checkpoint={checkpoint}
                  busy={busyId === checkpoint.id}
                  onResume={async (item) => {
                    setBusyId(item.id)
                    const result = await resumeFromCheckpoint(item.id)
                    setBusyId(null)
                    if (result.status === 'completed') {
                      toast('Fresh session created · original untouched')
                      navigate(`${routes.practice}/${result.value.id}`)
                    }
                  }}
                  onResolve={async (item) => {
                    const result = await resolveCheckpoint(item.id, 'resolved')
                    if (result.status === 'completed') candidates.mutate((items) => items.filter((entry) => entry.id !== item.id))
                  }}
                  onPause={async (item) => {
                    const result = await resolveCheckpoint(item.id, 'paused')
                    if (result.status === 'completed') candidates.mutate((items) => items.map((entry) => (entry.id === item.id ? result.value : entry)))
                  }}
                />
              ))}
            </div>
          )}
        </AsyncPanel>
        <aside className="k-stack">
          <Notice glyph="✦">AI drafts the checkpoint from the session's notes, dialogue and attempts, keeping the open question and next step. Your edits are what future resumption uses.</Notice>
          <Notice glyph="⛨">Deleted material shows as a broken reference; the checkpoint itself stays readable. Resuming never overwrites the original session.</Notice>
        </aside>
      </div>
    </div>
  )
}
