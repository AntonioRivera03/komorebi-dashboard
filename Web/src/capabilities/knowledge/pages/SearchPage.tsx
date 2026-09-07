import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { Select } from '../../../shared/ui/Select'
import { TextInput } from '../../../shared/ui/TextInput'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { routes } from '../../../shared/lib/routes'
import { useSearch } from '../interfaces/useSearch'
import { useTopics } from '../interfaces/useTopics'
import { SearchResultRow } from '../components/SearchResultRow'
import styles from '../knowledge.module.css'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [committed, setCommitted] = useState('')
  const [scope, setScope] = useState<'all' | 'notes' | 'sources'>('all')
  const [topic, setTopic] = useState('')
  const topics = useTopics()
  const results = useSearch(committed, scope, topic || undefined)

  return (
    <div className="k-page">
      <PageHeader back={{ to: routes.library, label: 'Library' }} eyebrow="Knowledge · lexical + semantic" title="Search" subtitle="Titles, note text and permitted extracted content. Every result exposes its source, locator and revision." />
      <form
        className={styles.searchBar}
        onSubmit={(event) => {
          event.preventDefault()
          setCommitted(query)
        }}
      >
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you looking for?" aria-label="Search query" autoFocus />
        <SegmentedControl label="Scope" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All' }, { value: 'notes', label: 'Notes' }, { value: 'sources', label: 'Sources' }]} />
        <Select aria-label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)} options={[{ value: '', label: 'Any topic' }, ...topics.map((item) => ({ value: item, label: item }))]} style={{ width: 'auto' }} />
      </form>
      <AsyncPanel query={results} isEmpty={(data) => data.length === 0} empty={<EmptyState glyph="◌" title="No authorized results">Deleted or revoked content never reappears here, even from a stale index.</EmptyState>} skeletonLines={5}>
        {(snapshot) => (
          <>
            <div className="k-row k-row--between" style={{ marginBottom: 8 }}>
              <span className="label">{snapshot.data.length} results{committed ? ` for “${committed}”` : ''}</span>
              <FreshnessBadge freshness={snapshot.freshness} observedAt={snapshot.observedAt} prefix="index" />
            </div>
            {snapshot.data.map((result) => (
              <SearchResultRow key={result.id} result={result} query={committed} />
            ))}
          </>
        )}
      </AsyncPanel>
    </div>
  )
}
