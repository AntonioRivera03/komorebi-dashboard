import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Button } from '../../shared/ui/Button'
import { Select } from '../../shared/ui/Select'
import { useLearn } from './useLearn'
import { ArtifactList, Composer, PreviewNote, SessionSelect } from './components'
import styles from './learn.module.css'

export default function ArtifactsPage() {
  const { state } = useLearn()
  const [params, setParams] = useSearchParams()
  const sessionId = params.get('session') ?? ''
  const [topic, setTopic] = useState('')
  const [creating, setCreating] = useState(false)
  const topics = [
    ...new Set(state.artifacts.filter((a) => !sessionId || a.sessionId === sessionId).map((a) => a.topic)),
  ]
  return (
    <div className={`k-page ${styles.page}`}>
      <PageHeader
        title="Artifacts"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            Capture artifact
          </Button>
        }
      />
      <div className={styles.filters}>
        <SessionSelect
          all
          value={sessionId}
          onChange={(v) => {
            setParams(v ? { session: v } : {})
            setTopic('')
          }}
        />
        <Select
          aria-label="Filter by topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          options={[{ value: '', label: 'All topics' }, ...topics.map((t) => ({ value: t, label: t }))]}
        />
      </div>
      <ArtifactList sessionId={sessionId} topic={topic} />
      {creating && <Composer kind="artifact" sessionId={sessionId} onClose={() => setCreating(false)} />}
      <PreviewNote />
    </div>
  )
}
