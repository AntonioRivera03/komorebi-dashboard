import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { IconButton } from '../../../shared/ui/IconButton'
import { useToast } from '../../../shared/ui/useToast'
import { useAgenda } from '../interfaces/useAgenda'
import { useConnection } from '../interfaces/useConnection'
import { cancelBlock, confirmBlock, refreshConnection } from '../interfaces/calendarApi'
import type { AgendaItem, BlockProposal } from '../interfaces/types'
import { AgendaItemPanel } from '../components/AgendaItemPanel'
import { ConnectionStatusCard } from '../components/ConnectionStatusCard'
import { ProposeBlockDialog } from '../components/ProposeBlockDialog'
import { WeekGrid } from '../components/WeekGrid'
import styles from '../calendar.module.css'

export default function CalendarPage() {
  const [view, setView] = useState<'day' | '3day' | 'week'>('week')
  const [offset, setOffset] = useState(0)
  const days = view === 'day' ? 1 : view === '3day' ? 3 : 7
  const fromDay = view === 'week' ? offset * 7 - ((new Date().getDay() + 6) % 7) : offset * days
  const agenda = useAgenda(fromDay, days)
  const connection = useConnection()
  const toast = useToast()
  const [selected, setSelected] = useState<AgendaItem | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [ghost, setGhost] = useState<BlockProposal | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await refreshConnection()
    setRefreshing(false)
    connection.reload()
    agenda.reload()
    toast('Connection refreshed · cursor advanced')
  }

  const confirm = async (proposal: BlockProposal) => {
    setConfirming(true)
    const result = await confirmBlock(proposal)
    setConfirming(false)
    if (result.status === 'completed') {
      agenda.mutate((items) => [...items, result.value])
      setSlot(null)
      setGhost(null)
      toast(`Block saved · ${result.value.lifecycle}`)
    }
  }

  const cancel = async (item: AgendaItem, scope: 'occurrence' | 'series') => {
    const result = await cancelBlock(item.id, scope)
    if (result.status === 'completed') {
      agenda.mutate((items) => items.map((current) => (current.id === item.id ? result.value : current)))
      setSelected(null)
      toast('Block canceled · task left untouched')
    }
  }

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Planning · P04"
        title="Calendar"
        subtitle="Provider events beside internal task blocks. Click an empty slot to propose a block; conflicts are previewed before anything is written."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setSlot(new Date(Date.now() + 3_600_000).toISOString())}>
            Schedule a task
          </Button>
        }
      />
      <AsyncPanel query={connection} skeletonLines={1}>
        {({ data }) => <ConnectionStatusCard connection={data} onRefresh={refresh} refreshing={refreshing} />}
      </AsyncPanel>
      <div className={styles.toolbar} style={{ marginTop: 18 }}>
        <div className="k-row">
          <IconButton icon="chevron-left" label="Earlier" onClick={() => setOffset((value) => value - 1)} />
          <Button variant="ghost" onClick={() => setOffset(0)}>
            Today
          </Button>
          <IconButton icon="chevron-right" label="Later" onClick={() => setOffset((value) => value + 1)} />
          <SegmentedControl label="View" value={view} onChange={(next) => { setView(next); setOffset(0) }} options={[{ value: 'day', label: 'Day' }, { value: '3day', label: '3 days' }, { value: 'week', label: 'Week' }]} />
        </div>
        <div className={styles.legend}>
          <span>
            <i style={{ background: 'var(--soft)', border: '1px solid var(--line)' }} />provider
          </span>
          <span>
            <i style={{ border: '1px dashed var(--accent)' }} />block · local
          </span>
          <span>
            <i style={{ background: 'var(--accent)' }} />block · synced
          </span>
          <span>
            <i style={{ boxShadow: 'inset 3px 0 0 var(--warn)', border: '1px solid var(--line)' }} />conflict / reconcile
          </span>
        </div>
      </div>
      <AsyncPanel query={agenda} skeletonLines={8}>
        {({ data }) => <WeekGrid fromDay={fromDay} days={days} items={data} ghost={ghost ? { start: ghost.start, end: ghost.end } : null} onSelect={setSelected} onSlot={setSlot} />}
      </AsyncPanel>
      <AgendaItemPanel item={selected} onClose={() => setSelected(null)} onCancel={cancel} />
      <ProposeBlockDialog start={slot} onClose={() => setSlot(null)} onProposal={setGhost} onConfirm={confirm} busy={confirming} />
    </div>
  )
}
