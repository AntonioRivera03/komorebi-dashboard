import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Switch } from '../../../shared/ui/Switch'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { TextInput } from '../../../shared/ui/TextInput'
import { Notice } from '../../../shared/ui/Notice'
import { routes } from '../../../shared/lib/routes'
import { formatRelative } from '../../../shared/lib/format'
import { useSubscriptions } from '../interfaces/useSubscriptions'
import { addSubscription, toggleSubscription } from '../interfaces/briefingsApi'
import styles from '../briefings.module.css'

export default function BriefingSourcesPage() {
  const subscriptions = useSubscriptions()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  return (
    <div className="k-page">
      <PageHeader back={{ to: routes.briefing, label: 'Briefing' }} eyebrow="Briefings · sources" title="Sources and interests" subtitle="Feeds, weather, a minimal calendar summary and explicitly selected Knowledge topics. Only permitted excerpts and metadata are stored." />
      <div className="k-grid k-grid--sidebar">
        <section>
          <form
            className="k-row"
            style={{ marginBottom: 12 }}
            onSubmit={async (event) => {
              event.preventDefault()
              const result = await addSubscription(name, url)
              if (result.status === 'completed') {
                subscriptions.mutate((current) => [...current, result.value])
                setUrl('')
                setName('')
              }
            }}
          >
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" aria-label="Feed name" style={{ width: 160 }} />
            <TextInput mono value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…/feed.xml" aria-label="Feed URL" style={{ flex: 1 }} />
            <Button type="submit" size="sm" icon="plus" disabled={!url.trim()}>
              Add feed
            </Button>
          </form>
          <AsyncPanel query={subscriptions} skeletonLines={6}>
            {({ data }) =>
              data.map((sub) => (
                <div key={sub.id} className={styles.sub}>
                  <div>
                    <strong style={{ fontWeight: 500 }}>{sub.name}</strong>
                    <small>
                      {sub.kind} · {sub.url}
                      {sub.lastFetchAt ? ` · fetched ${formatRelative(sub.lastFetchAt)}` : ' · never fetched'}
                    </small>
                  </div>
                  <div className="k-row">
                    <StatusPill tone={sub.status === 'ok' ? 'ok' : sub.status === 'failed' ? 'danger' : 'neutral'} dot>
                      {sub.status}
                    </StatusPill>
                    <Switch
                      label={`Enable ${sub.name}`}
                      checked={sub.enabled}
                      onChange={async () => {
                        const result = await toggleSubscription(sub.id)
                        if (result.status === 'completed') subscriptions.mutate((current) => current.map((entry) => (entry.id === sub.id ? result.value : entry)))
                      }}
                    />
                  </div>
                </div>
              ))
            }
          </AsyncPanel>
        </section>
        <aside className="k-stack">
          <Notice glyph="⛨">Refresh jobs deduplicate by provider item ID or canonical URL. Feed content is untrusted data, never instructions to the assistant.</Notice>
          <Notice glyph="※">A new briefing source never requires editing Home, Study or Tasks.</Notice>
        </aside>
      </div>
    </div>
  )
}
