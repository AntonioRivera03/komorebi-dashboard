import { useNavigate } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Switch } from '../../../shared/ui/Switch'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useReviewSummary } from '../interfaces/useReviewSummary'
import { pauseTopic, startReviewSession, updateProfile } from '../interfaces/reviewsApi'
import { DueItemRow } from '../components/DueItemRow'
import { WorkloadPanel } from '../components/WorkloadPanel'
import styles from '../reviews.module.css'

export default function ReviewPage() {
  const summary = useReviewSummary()
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <div className="k-page">
      <AsyncPanel query={summary} skeletonLines={8}>
        {({ data }) => {
          const paused = data.topics.filter((topic) => topic.paused).map((topic) => topic.topic)
          const eligible = data.due.filter((item) => !paused.includes(item.topic)).slice(0, data.profile.dailyCap)
          return (
            <>
              <PageHeader
                eyebrow="Reviews · L04 · interested"
                title="Review"
                subtitle="Spaced retrieval scheduled from your attempt history. The scheduler is deterministic; AI never chooses an interval."
                actions={
                  <Button
                    variant="primary"
                    icon="play"
                    disabled={eligible.length === 0}
                    onClick={async () => {
                      const result = await startReviewSession(eligible.map((item) => item.enrollmentId))
                      if (result.status === 'completed') {
                        toast('Review session started through Study')
                        navigate(`${routes.practice}/${result.value.sessionId}`)
                      }
                    }}
                  >
                    Review {eligible.length} due
                  </Button>
                }
              />
              <div className="k-grid k-grid--2">
                <div>
                  <Panel flush>
                    <PanelHead title="Due now" eyebrow="Ordered by overdue, then stability" meta={<StatusPill>{data.due.length} due · cap {data.profile.dailyCap}</StatusPill>} />
                    {data.due.map((item) => (
                      <DueItemRow key={item.enrollmentId} item={item} paused={paused.includes(item.topic)} />
                    ))}
                  </Panel>
                  <Panel>
                    <PanelHead title="Topics" eyebrow="Pause without losing history" />
                    {data.topics.map((topic) => (
                      <div key={topic.topic} className={styles.topic}>
                        <span>
                          {topic.topic} <span className="muted small mono">· {topic.enrolled} enrolled · {topic.due} due</span>
                        </span>
                        <div className="k-row">
                          {topic.paused ? <StatusPill tone="warn">paused</StatusPill> : null}
                          <Switch
                            label={`${topic.paused ? 'Resume' : 'Pause'} ${topic.topic}`}
                            checked={!topic.paused}
                            onChange={async (active) => {
                              const result = await pauseTopic(topic.topic, !active)
                              if (result.status === 'completed') summary.mutate((current) => ({ ...current, topics: current.topics.map((entry) => ({ ...entry, paused: result.value.includes(entry.topic) })) }))
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </Panel>
                </div>
                <div>
                  <Panel flush>
                    <PanelHead title="Workload" eyebrow="Trade-offs made visible" />
                    <WorkloadPanel
                      profile={data.profile}
                      forecast={data.workloadForecast}
                      tradeoff={data.retentionTradeoff}
                      onCap={async (cap) => {
                        summary.mutate((current) => ({ ...current, profile: { ...current.profile, dailyCap: cap } }))
                        await updateProfile({ dailyCap: cap })
                      }}
                      onRetention={async (retention) => {
                        summary.mutate((current) => ({ ...current, profile: { ...current.profile, retention } }))
                        await updateProfile({ retention })
                      }}
                    />
                  </Panel>
                  <div style={{ marginTop: 16 }} className="k-stack">
                    <Notice glyph="⚙">Each (enrollment, assessment, scheduler version) applies at most once. Unassessed or AI-draft outcomes never update retention estimates silently.</Notice>
                    <Notice glyph="✦">AI may help repair a confusing prompt as a new draft revision; it never touches the schedule.</Notice>
                  </div>
                </div>
              </div>
            </>
          )
        }}
      </AsyncPanel>
    </div>
  )
}
