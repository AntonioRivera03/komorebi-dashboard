import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { StatTile } from '../../../shared/ui/StatTile'
import { TextInput } from '../../../shared/ui/TextInput'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { daysUntil, formatLongDay } from '../../../shared/lib/format'
import { useExam } from '../interfaces/useExam'
import { acceptRepair, addTopic, reviewMarking, startPractice } from '../interfaces/examsApi'
import { ErrorLogEntryCard } from '../components/ErrorLogEntryCard'
import { PracticeRunRow } from '../components/PracticeRunRow'
import { StartPracticeDialog } from '../components/StartPracticeDialog'
import { TopicCoverageTable } from '../components/TopicCoverageTable'

export default function ExamPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const exam = useExam(id)
  const toast = useToast()
  const [starting, setStarting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  return (
    <div className="k-page">
      <AsyncPanel query={exam} skeletonLines={8}>
        {({ data }) => (
          <>
            <PageHeader
              back={params.get('session') ? { to: `${routes.sessions}/${encodeURIComponent(params.get('session')!)}?section=Exams`, label: 'Session exams' } : { to: routes.exams, label: 'Exams' }}
              eyebrow={
                <span className="k-row">
                  <StatusPill tone="warn">{daysUntil(data.date)} days · {formatLongDay(data.date)}</StatusPill>
                  <span>
                    blueprint r{data.blueprintRevision} · rubric r{data.rubricRevision}
                  </span>
                </span>
              }
              title={data.title}
              subtitle={data.format}
              actions={
                <Button variant="primary" icon="play" onClick={() => setStarting(true)}>
                  Start practice set
                </Button>
              }
            />
            <div className="k-stats" style={{ marginBottom: 8 }}>
              <StatTile value={data.topics.length} label="syllabus topics" />
              <StatTile value={data.topics.reduce((sum, topic) => sum + topic.promptCount, 0)} label="linked prompts" />
              <StatTile value={data.runs.filter((run) => run.status === 'assessed').length} label="assessed runs" />
              <StatTile value={data.errors.filter((error) => !error.repair).length} label="unrepaired" />
            </div>
            <div className="k-grid k-grid--2">
              <div>
                <Panel>
                  <PanelHead title="Blueprint" eyebrow="Coverage ≠ performance" />
                  <TopicCoverageTable topics={data.topics} />
                  <form
                    className="k-row"
                    style={{ marginTop: 12 }}
                    onSubmit={async (event) => {
                      event.preventDefault()
                      if (!newTopic.trim()) return
                      const result = await addTopic(data.id, newTopic.trim(), 10)
                      if (result.status === 'completed') {
                        exam.mutate(() => result.value)
                        setNewTopic('')
                        toast('Topic added · blueprint revision bumped')
                      }
                    }}
                  >
                    <TextInput value={newTopic} onChange={(event) => setNewTopic(event.target.value)} placeholder="Add a syllabus topic" style={{ flex: 1 }} aria-label="New topic" />
                    <Button type="submit" size="sm" disabled={!newTopic.trim()}>
                      Add
                    </Button>
                  </form>
                </Panel>
                <Panel>
                  <PanelHead title="Practice runs" eyebrow="Each pins blueprint, rubric and session" />
                  {data.runs.length === 0 ? <p className="muted small">No runs yet.</p> : null}
                  {data.runs.map((run) => (
                    <PracticeRunRow
                      key={run.id}
                      run={run}
                      busy={busy}
                      onReview={async (item) => {
                        setBusy(true)
                        const result = await reviewMarking(data.id, item.id)
                        setBusy(false)
                        if (result.status === 'completed') {
                          exam.reload()
                          toast('Marking reviewed · result versioned')
                        }
                      }}
                    />
                  ))}
                </Panel>
              </div>
              <div>
                <Panel flush>
                  <PanelHead title="Error log" eyebrow="Mistakes → accepted repairs → fresh attempts" />
                  <div className="k-stack">
                    {data.errors.length === 0 ? <p className="muted small">No mistakes logged yet.</p> : null}
                    {data.errors.map((entry) => (
                      <ErrorLogEntryCard
                        key={entry.id}
                        entry={entry}
                        topicName={data.topics.find((topic) => topic.id === entry.topicId)?.name ?? entry.topicId}
                        onRepair={async (item, kind) => {
                          const result = await acceptRepair(data.id, item.id, kind)
                          if (result.status === 'completed') {
                            exam.reload()
                            toast(`Repair accepted · ${result.value.repair?.label}`)
                          }
                        }}
                      />
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
            <StartPracticeDialog
              open={starting}
              busy={busy}
              onClose={() => setStarting(false)}
              onStart={async (timed, duration) => {
                setBusy(true)
                const result = await startPractice(data.id, timed, duration)
                setBusy(false)
                if (result.status === 'completed') {
                  setStarting(false)
                  exam.reload()
                  toast('Practice run created · Study session pinned')
                }
              }}
            />
          </>
        )}
      </AsyncPanel>
    </div>
  )
}
