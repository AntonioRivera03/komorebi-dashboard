import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Notice } from '../../../shared/ui/Notice'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { useToast } from '../../../shared/ui/useToast'
import { formatRelative } from '../../../shared/lib/format'
import { useCandidates } from '../interfaces/useCandidates'
import { decideCandidate, requestSuggestions } from '../interfaces/connectionsApi'
import { CandidateCard } from '../components/CandidateCard'

export default function ConnectionsPage() {
  const candidates = useCandidates()
  const toast = useToast()
  const [requesting, setRequesting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Connections · L08"
        title="Unexpected connections"
        subtitle="Occasionally, a useful bridge between things you already know. Every suggestion pins both note revisions and shows its evidence and limits."
        actions={
          <Button
            variant="primary"
            icon="sparkle"
            busy={requesting}
            onClick={async () => {
              setRequesting(true)
              const result = await requestSuggestions()
              setRequesting(false)
              if (result.status === 'completed') {
                candidates.reload()
                toast(result.value.status === 'no_candidates' ? 'No useful candidates — that is a valid result' : `${result.value.candidates} new suggestion`)
              }
            }}
          >
            Suggest a few
          </Button>
        }
      />
      <div className="k-grid k-grid--sidebar">
        <AsyncPanel query={candidates} isEmpty={(data) => data.candidates.length === 0} empty={<EmptyState glyph="⟷" title="Nothing suggested yet">Request suggestions when you want them. No candidates is a valid result.</EmptyState>} skeletonLines={8}>
          {({ data }) => (
            <div className="k-stack" style={{ gap: 16 }}>
              {data.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  busy={busyId === candidate.id}
                  onDecide={async (item, decision, relation) => {
                    setBusyId(item.id)
                    candidates.mutate((current) => ({ ...current, candidates: current.candidates.map((entry) => (entry.id === item.id && decision === 'accepted' ? { ...entry, status: 'promoting' } : entry)) }))
                    const result = await decideCandidate(item.id, decision, relation)
                    setBusyId(null)
                    if (result.status === 'completed') {
                      candidates.mutate((current) => ({ ...current, candidates: current.candidates.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                      toast(decision === 'accepted' ? 'Relation added in Knowledge exactly once' : 'Dismissed · will not be re-suggested for unchanged inputs')
                    } else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'danger' })
                  }}
                />
              ))}
            </div>
          )}
        </AsyncPanel>
        <aside className="k-stack">
          {candidates.snapshot ? (
            <div>
              <span className="label">Suggestion runs</span>
              {candidates.snapshot.data.runs.map((run) => (
                <div key={run.id} className="k-list-row">
                  <span className="k-list-row__main">
                    <strong>{run.id}</strong>
                    <small>
                      {run.model} · {formatRelative(run.at)}
                    </small>
                  </span>
                  <StatusPill tone={run.status === 'completed' ? 'ok' : 'neutral'}>{run.candidates} candidates</StatusPill>
                </div>
              ))}
            </div>
          ) : null}
          <Notice glyph="✦">AI proposes links only from the selected note excerpts and must distinguish an analogy from a factual equivalence. Acceptance, correction and dismissal are persisted as feedback.</Notice>
          <Notice glyph="⛨">A changed or deleted note invalidates the suggestion before approval. Promotion is idempotent: a retry cannot add the same relation twice.</Notice>
        </aside>
      </div>
    </div>
  )
}
