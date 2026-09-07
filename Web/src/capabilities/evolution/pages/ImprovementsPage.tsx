import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Notice } from '../../../shared/ui/Notice'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useImprovementCandidates } from '../interfaces/useCandidates'
import { evaluateCandidate, recordDecision } from '../interfaces/evolutionApi'
import { CandidateCard } from '../components/CandidateCard'
import { CandidateDetail } from '../components/CandidateDetail'

export default function ImprovementsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const candidates = useImprovementCandidates()

  useEffect(() => {
    if (!id && candidates.status === 'ready' && candidates.snapshot.data[0]) navigate(`${routes.improvements}/${candidates.snapshot.data[0].id}`, { replace: true })
  }, [id, candidates, navigate])

  return (
    <div className="k-page">
      <PageHeader eyebrow="Evolution · E04" title="Improvements with evidence" subtitle="Friction and opportunity, the proposed change, evaluation and outcomes. Assistance changes are separated from changes to application behaviour or code." />
      <Notice glyph="※">Autonomous execution authority awaits the rest of the brief. Evidence collection, evaluation and change records work today; nothing changes code because a model suggested it.</Notice>
      <AsyncPanel query={candidates} skeletonLines={8}>
        {({ data }) => {
          const active = data.find((item) => item.id === id)
          return (
            <div className="k-grid k-grid--2" style={{ marginTop: 20, gridTemplateColumns: '1fr 1.2fr' }}>
              <div className="k-stack" style={{ gap: 12 }}>
                {data.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} active={candidate.id === id} onSelect={(next) => navigate(`${routes.improvements}/${next}`)} />
                ))}
              </div>
              <div>
                {active ? (
                  <CandidateDetail
                    candidate={active}
                    onEvaluate={async (candidate) => {
                      const result = await evaluateCandidate(candidate.id)
                      if (result.status === 'completed') {
                        candidates.mutate((current) => current.map((item) => (item.id === candidate.id ? result.value : item)))
                        toast('Evaluation recorded')
                      }
                    }}
                    onDecide={async (candidate, decision, note) => {
                      const result = await recordDecision(candidate.id, decision, note)
                      if (result.status === 'completed') {
                        candidates.mutate((current) => current.map((item) => (item.id === candidate.id ? result.value : item)))
                        toast(`Decision recorded · ${decision}`)
                      } else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'warn', durationMs: 7000 })
                    }}
                  />
                ) : (
                  <EmptyState glyph="◔" title="Pick a candidate" />
                )}
              </div>
            </div>
          )
        }}
      </AsyncPanel>
    </div>
  )
}
