import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Notice } from '../../../shared/ui/Notice'
import { StatTile } from '../../../shared/ui/StatTile'
import { routes } from '../../../shared/lib/routes'
import { useSessions } from '../interfaces/useSessions'
import { PromptLibraryPanel } from '../components/PromptLibraryPanel'
import { SessionRow } from '../components/SessionRow'

export default function SessionsPage() {
  const sessions = useSessions()
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Study · L03"
        title="Sessions"
        subtitle="Read or watch, recall without help, get feedback, then apply. Each attempt pins the exact prompt and source revision it used."
        actions={
          <Button variant="primary" icon="play" onClick={() => setStarting(true)}>
            Start a session
          </Button>
        }
      />
      <div className="k-grid k-grid--sidebar">
        <section>
          <AsyncPanel query={sessions} isEmpty={(data) => data.length === 0} empty={<EmptyState glyph="◐" title="No sessions yet" action={<Button onClick={() => setStarting(true)}>Choose prompts</Button>}>Pick approved prompts from a source and answer before revealing.</EmptyState>} skeletonLines={5}>
            {({ data }) => data.map((session) => <SessionRow key={session.id} session={session} />)}
          </AsyncPanel>
        </section>
        <aside className="k-stack">
          {sessions.snapshot ? (
            <div className="k-stats">
              <StatTile value={sessions.snapshot.data.filter((session) => session.status !== 'ended').length} label="open or paused" />
              <StatTile value={sessions.snapshot.data.reduce((sum, session) => sum + session.items.reduce((inner, item) => inner + item.attemptIds.length, 0), 0)} label="attempts recorded" />
            </div>
          ) : null}
          <Notice glyph="✦">AI drafts prompts, asks follow-ups, suggests hints and compares answers with cited source locations. Its feedback stays a suggestion until you review it.</Notice>
          <Notice glyph="⛨">Answers are saved before any feedback request. A failed or canceled model call cannot erase them; a duplicate submission cannot create two attempts.</Notice>
        </aside>
      </div>
      <PromptLibraryPanel
        open={starting}
        onClose={() => setStarting(false)}
        onStarted={(session) => {
          setStarting(false)
          navigate(`${routes.practice}/${session.id}`)
        }}
      />
    </div>
  )
}
