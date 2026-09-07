import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { StatTile } from '../../../shared/ui/StatTile'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { useMemory } from '../interfaces/useMemory'
import { confirmMemory, correctMemory, forgetMemory } from '../interfaces/memoryApi'
import type { MemoryType } from '../interfaces/types'
import { MemoryCard } from '../components/MemoryCard'

export default function MemoryPage() {
  const memory = useMemory()
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | MemoryType>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  return (
    <div className="k-page">
      <PageHeader eyebrow="Memory · E03" title="What Komorebi remembers" subtitle="Each item shows why it is believed, when it last applied and whether it came from an explicit statement or an inference. Corrections beat earlier inference." actions={<SegmentedControl label="Type" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'stated_preference', label: 'Preferences' }, { value: 'stated_fact', label: 'Facts' }, { value: 'inferred_pattern', label: 'Inferred' }, { value: 'working_summary', label: 'Summaries' }]} />} />
      <div className="k-grid k-grid--sidebar">
        <AsyncPanel query={memory} skeletonLines={8}>
          {({ data }) => (
            <div className="k-stack" style={{ gap: 14 }}>
              {data
                .filter((item) => filter === 'all' || item.type === filter)
                .map((item) => (
                  <MemoryCard
                    key={item.id}
                    item={item}
                    busy={busyId === item.id}
                    onCorrect={async (entry, statement) => {
                      setBusyId(entry.id)
                      const result = await correctMemory(entry.id, statement)
                      setBusyId(null)
                      if (result.status === 'completed') {
                        memory.mutate((current) => current.map((row) => (row.id === entry.id ? result.value : row)))
                        toast('Corrected · future retrieval uses this; evidence preserved')
                      }
                    }}
                    onForget={async (entry) => {
                      setBusyId(entry.id)
                      const result = await forgetMemory(entry.id)
                      setBusyId(null)
                      if (result.status === 'completed') {
                        memory.mutate((current) => current.map((row) => (row.id === entry.id ? result.value : row)))
                        toast('Suppressed · unchanged historical evidence will not recreate it')
                      }
                    }}
                    onConfirm={async (entry) => {
                      const result = await confirmMemory(entry.id)
                      if (result.status === 'completed') memory.mutate((current) => current.map((row) => (row.id === entry.id ? result.value : row)))
                    }}
                  />
                ))}
            </div>
          )}
        </AsyncPanel>
        <aside className="k-stack">
          {memory.snapshot ? (
            <div className="k-stats">
              <StatTile value={memory.snapshot.data.filter((item) => item.status === 'active').length} label="active" />
              <StatTile value={memory.snapshot.data.filter((item) => item.provenance === 'inferred').length} label="inferred" />
              <StatTile value={memory.snapshot.data.filter((item) => item.status === 'conflicted').length} label="conflicted" />
            </div>
          ) : null}
          <Notice glyph="≈">An inferred pattern with counts never silently becomes a stated preference. An assistant reply is not evidence just because it was said earlier.</Notice>
          <Notice glyph="⛨">Before any item reaches a model or this page, owners re-validate access, deletion and revision. A delayed deletion cannot expose stale memory.</Notice>
        </aside>
      </div>
    </div>
  )
}
