import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { Tabs } from '../../../shared/ui/Tabs'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { newId } from '../../../shared/api/mock'
import { routes } from '../../../shared/lib/routes'
import { useShopping } from '../interfaces/useShopping'
import { useMaintenance } from '../interfaces/useMaintenance'
import { addShoppingItem, completeMaintenance, createTemplate, pauseTemplate, setPurchased, toggleRepeat } from '../interfaces/householdApi'
import { MaintenanceCard } from '../components/MaintenanceCard'
import { NewTemplateDialog } from '../components/NewTemplateDialog'
import { ParseListDialog } from '../components/ParseListDialog'
import { ShoppingAddRow } from '../components/ShoppingAddRow'
import { ShoppingItemRow } from '../components/ShoppingItemRow'

export default function HouseholdPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const active = tab === 'maintenance' ? 'maintenance' : 'shopping'
  const [listId, setListId] = useState('list_main')
  const shopping = useShopping(listId)
  const maintenance = useMaintenance()
  const [parsing, setParsing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const add = async (name: string, quantity: string, key: string) => {
    const result = await addShoppingItem(listId, name, quantity, key)
    if (result.status === 'completed') shopping.mutate((data) => (data.items.some((item) => item.id === result.value.id) ? data : { ...data, items: [...data.items, result.value] }))
  }

  return (
    <div className="k-page">
      <PageHeader eyebrow="Household · M05 · M06" title="Household" subtitle="Shopping, chores, renewals and maintenance in a quiet shared rhythm. Tasks owns generated occurrences; Household owns cadence and instructions." />
      <Tabs label="Household sections" active={active} onChange={(next) => navigate(`${routes.household}/${next}`)} tabs={[{ id: 'shopping', label: 'Shopping', count: shopping.snapshot?.data.items.filter((item) => !item.purchased).length }, { id: 'maintenance', label: 'Maintenance', count: maintenance.snapshot?.data.filter((template) => !template.paused).length }]} />
      {active === 'shopping' ? (
        <div className="k-grid k-grid--sidebar">
          <section>
            <div className="k-row k-row--between" style={{ marginBottom: 14 }}>
              <AsyncPanel query={shopping} skeletonLines={1}>
                {({ data }) => <SegmentedControl label="List" value={listId} onChange={setListId} options={data.lists.map((list) => ({ value: list.id, label: `${list.name}${list.scope === 'household' ? ' · shared' : ''}` }))} />}
              </AsyncPanel>
              <Button icon="sparkle" size="sm" onClick={() => setParsing(true)}>
                Paste a list
              </Button>
            </div>
            <ShoppingAddRow onAdd={add} />
            <AsyncPanel query={shopping} skeletonLines={5}>
              {({ data }) => (
                <>
                  {[...data.items]
                    .sort((a, b) => Number(a.purchased) - Number(b.purchased))
                    .map((item) => (
                      <ShoppingItemRow
                        key={item.id}
                        item={item}
                        onToggle={async (entry) => {
                          const result = await setPurchased(entry.id, !entry.purchased, entry.revision)
                          if (result.status === 'completed') shopping.mutate((current) => ({ ...current, items: current.items.map((row) => (row.id === entry.id ? result.value : row)) }))
                          else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'danger' })
                        }}
                        onRepeat={async (entry) => {
                          const result = await toggleRepeat(entry.id)
                          if (result.status === 'completed') shopping.mutate((current) => ({ ...current, items: current.items.map((row) => (row.id === entry.id ? result.value : row)) }))
                        }}
                      />
                    ))}
                </>
              )}
            </AsyncPanel>
          </section>
          <aside className="k-stack">
            <Notice glyph="🎙">“Add oat milk to the shopping list” by voice or capture reaches this list through the Household command with one request identity.</Notice>
            <Notice glyph="⛨">Purchase and restore survive refresh; replaying the same add-item command creates one item. This is a shopping record, not a task with overloaded status.</Notice>
          </aside>
        </div>
      ) : (
        <div className="k-grid k-grid--sidebar">
          <section>
            <div className="k-row k-row--between" style={{ marginBottom: 14 }}>
              <span className="label">Pending occurrences and history</span>
              <Button variant="primary" size="sm" icon="plus" onClick={() => setCreating(true)}>
                New template
              </Button>
            </div>
            <AsyncPanel query={maintenance} skeletonLines={6}>
              {({ data }) => (
                <div className="k-grid k-grid--cards">
                  {data.map((template) => (
                    <MaintenanceCard
                      key={template.id}
                      template={template}
                      busy={busyId === template.id}
                      onComplete={async (item) => {
                        setBusyId(item.id)
                        const result = await completeMaintenance(item.id, newId('idem'))
                        setBusyId(null)
                        if (result.status === 'completed') {
                          maintenance.mutate((current) => current.map((entry) => (entry.id === item.id ? result.value : entry)))
                          toast('Completed · exactly one next occurrence generated')
                        }
                      }}
                      onPause={async (item, paused) => {
                        const result = await pauseTemplate(item.id, paused)
                        if (result.status === 'completed') maintenance.mutate((current) => current.map((entry) => (entry.id === item.id ? result.value : entry)))
                      }}
                    />
                  ))}
                </div>
              )}
            </AsyncPanel>
          </section>
          <aside className="k-stack">
            <Notice glyph="↻">Calendar-based schedules delegate recurrence to Tasks. Completion-relative schedules create one next task after each completion with a unique generation key, so a retry cannot duplicate a chore.</Notice>
            <Notice glyph="⛨">A deleted Home entity leaves a descriptive broken reference; the instructions stay. Pausing stops generation without deleting history.</Notice>
          </aside>
        </div>
      )}
      <ParseListDialog
        open={parsing}
        onClose={() => setParsing(false)}
        onAccept={async (drafts) => {
          for (const draft of drafts) await add(draft.name, draft.quantity, newId('idem'))
          setParsing(false)
          toast(`Added ${drafts.length} items`)
        }}
      />
      <NewTemplateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={async (draft) => {
          const result = await createTemplate(draft)
          if (result.status === 'completed') {
            maintenance.mutate((current) => [...current, result.value])
            setCreating(false)
            toast('Template created · first occurrence requested from Tasks')
          }
        }}
      />
    </div>
  )
}
