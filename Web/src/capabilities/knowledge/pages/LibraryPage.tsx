import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { StatTile } from '../../../shared/ui/StatTile'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useSources } from '../interfaces/useSources'
import type { ExtractionState } from '../interfaces/types'
import { ImportSourceDialog } from '../components/ImportSourceDialog'
import { SourceRow } from '../components/SourceRow'

export default function LibraryPage() {
  const sources = useSources()
  const toast = useToast()
  const [importing, setImporting] = useState(false)
  const [filter, setFilter] = useState<'all' | ExtractionState>('all')
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Knowledge · L01"
        title="Library"
        subtitle="Sources with traceable locations. Originals are preserved; extraction is a separate, retryable job; re-extraction creates a new immutable revision."
        actions={
          <>
            <Link to={routes.librarySearch}>
              <Button icon="search">Search</Button>
            </Link>
            <Button variant="primary" icon="plus" onClick={() => setImporting(true)}>
              Import source
            </Button>
          </>
        }
      />
      <div className="k-grid k-grid--sidebar">
        <section>
          <div style={{ marginBottom: 16 }}>
            <SegmentedControl label="Extraction state" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'ready', label: 'Ready' }, { value: 'extracting', label: 'Working' }, { value: 'partial', label: 'Partial' }, { value: 'failed', label: 'Failed' }]} />
          </div>
          <AsyncPanel query={sources} isEmpty={(data) => data.filter((source) => filter === 'all' || source.state === filter).length === 0} empty={<EmptyState glyph="▤" title="No sources here" action={<Button onClick={() => setImporting(true)}>Import one</Button>}>URLs, text and text-based PDFs are supported first.</EmptyState>} skeletonLines={6}>
            {({ data }) => (
              <>
                {data
                  .filter((source) => filter === 'all' || source.state === filter || (filter === 'extracting' && source.state === 'queued'))
                  .map((source) => (
                    <SourceRow key={source.id} source={source} />
                  ))}
              </>
            )}
          </AsyncPanel>
        </section>
        <aside className="k-stack">
          {sources.snapshot ? (
            <div className="k-stats">
              <StatTile value={sources.snapshot.data.length} label="sources" />
              <StatTile value={sources.snapshot.data.filter((source) => source.state === 'ready').length} label="ready" />
              <StatTile value={sources.snapshot.data.filter((source) => source.state === 'failed' || source.state === 'partial').length} label="need attention" />
            </div>
          ) : null}
          <Notice glyph="⌖">Every passage carries a stable page, section or character-range locator. Notes and prompts cite those locators, and a revised source never rewrites what an old attempt used.</Notice>
          <Notice glyph="⛨">The server URL fetcher rejects private-network targets and unapproved schemes. Home Assistant is a separate, allow-listed path.</Notice>
        </aside>
      </div>
      <ImportSourceDialog
        open={importing}
        onClose={() => setImporting(false)}
        onImported={(source) => {
          sources.mutate((items) => [source, ...items])
          toast('Import queued · extraction runs in the background', { action: { label: 'Refresh', onClick: sources.reload } })
        }}
      />
    </div>
  )
}
