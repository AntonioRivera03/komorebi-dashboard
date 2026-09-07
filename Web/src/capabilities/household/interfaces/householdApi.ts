import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { MaintenanceTemplate, ShoppingItem, ShoppingList, ShoppingParseDraft } from './types'

/* Household HTTP adapter (mock): /api/v1/household/... */

const lists: ShoppingList[] = [
  { id: 'list_main', name: 'Groceries', scope: 'household' },
  { id: 'list_hw', name: 'Hardware store', scope: 'personal' },
]

let items: ShoppingItem[] = [
  { id: 'si_1', listId: 'list_main', name: 'Oat milk', quantity: '2', purchased: false, repeat: true, revision: 1, addedVia: 'voice' },
  { id: 'si_2', listId: 'list_main', name: 'Coffee filters', quantity: '1 box', purchased: false, repeat: true, revision: 1, addedVia: 'typed' },
  { id: 'si_3', listId: 'list_main', name: 'Rice', quantity: '1 kg', purchased: false, repeat: false, revision: 2, addedVia: 'typed' },
  { id: 'si_4', listId: 'list_main', name: 'Dish soap', quantity: '1', purchased: false, repeat: true, revision: 1, addedVia: 'capture' },
  { id: 'si_5', listId: 'list_main', name: 'Lemons', quantity: '4', purchased: true, repeat: false, revision: 3, addedVia: 'typed' },
  { id: 'si_6', listId: 'list_hw', name: 'Tap filter cartridge', quantity: '2', purchased: false, repeat: false, revision: 1, addedVia: 'typed' },
]

let templates: MaintenanceTemplate[] = [
  { id: 'mt_plants', title: 'Water the balcony plants', instructions: 'Soil moisture below 30% means water. Skip after rain.', cadence: { mode: 'calendar', rule: 'every 3 days' }, linkedAsset: { kind: 'device', label: 'Soil moisture sensor', available: true }, paused: false, nextTask: { ref: { owner: 'tasks', kind: 'task', id: 'tsk_4' }, dueAt: daysFromNow(1, 8), state: 'open' }, lastCompletedAt: minutesAgo(3000), history: [{ at: minutesAgo(3000), note: 'Completed' }, { at: minutesAgo(7500), note: 'Completed' }], revision: 2 },
  { id: 'mt_filter', title: 'Replace kitchen tap filter', instructions: 'Cartridge under the sink; turn the blue ring counter-clockwise. Note the date on the housing.', cadence: { mode: 'completion_relative', days: 90 }, linkedAsset: { kind: 'document', label: 'Filter manual (PDF)', available: true }, paused: false, nextTask: { ref: { owner: 'tasks', kind: 'task', id: 'tsk_next_filter' }, dueAt: daysFromNow(87, 10), state: 'open' }, lastCompletedAt: minutesAgo(3600), history: [{ at: minutesAgo(3600), note: 'Completed · next generated (template, occurrence tsk_7)' }], revision: 3 },
  { id: 'mt_renew', title: 'Renew contents insurance', instructions: 'Compare two quotes before renewing. Policy number in the Documents folder.', cadence: { mode: 'calendar', rule: 'yearly · 1 November' }, paused: false, nextTask: { ref: { owner: 'tasks', kind: 'task', id: 'tsk_ins' }, dueAt: daysFromNow(57, 9), state: 'open' }, history: [], revision: 1 },
  { id: 'mt_heater', title: 'Descale the bathroom heater', instructions: 'Vinegar solution, 30 min. Ventilate.', cadence: { mode: 'completion_relative', days: 180 }, linkedAsset: { kind: 'device', label: 'Bathroom heater (entity removed)', available: false }, paused: true, lastCompletedAt: minutesAgo(200000), history: [{ at: minutesAgo(200000), note: 'Completed' }], revision: 4 },
]

const addKeys = new Map<string, string>()

export async function listShopping(listId: string): Promise<Snapshot<{ lists: ShoppingList[]; items: ShoppingItem[] }>> {
  await wait()
  return snapshot({ lists, items: items.filter((item) => item.listId === listId) })
}

export async function addShoppingItem(listId: string, name: string, quantity: string, idempotencyKey: string, addedVia: ShoppingItem['addedVia'] = 'typed'): Promise<Operation<ShoppingItem>> {
  await wait(220)
  const existing = addKeys.get(idempotencyKey)
  if (existing) return completed(items.find((item) => item.id === existing) as ShoppingItem)
  if (!name.trim()) return failedOperation('validation', false, 'Name the item.')
  const item: ShoppingItem = { id: newId('si'), listId, name: name.trim(), quantity: quantity.trim() || '1', purchased: false, repeat: false, revision: 1, addedVia }
  items = [...items, item]
  addKeys.set(idempotencyKey, item.id)
  return completed(item)
}

export async function setPurchased(id: string, purchased: boolean, expectedRevision: number): Promise<Operation<ShoppingItem>> {
  await wait(160)
  const item = items.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  if (item.revision !== expectedRevision) return failedOperation('revision_conflict', false, 'Edited concurrently; reload.')
  const next = { ...item, purchased, revision: item.revision + 1 }
  items = items.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function toggleRepeat(id: string): Promise<Operation<ShoppingItem>> {
  await wait(120)
  const item = items.find((entry) => entry.id === id)
  if (!item) return failedOperation('not_found', false)
  const next = { ...item, repeat: !item.repeat, revision: item.revision + 1 }
  items = items.map((entry) => (entry.id === id ? next : entry))
  return completed(next)
}

export async function parseShoppingText(text: string): Promise<ShoppingParseDraft[]> {
  await wait(900)
  return text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+(?:\s?\w+)?)\s+(.+)$/) ?? line.match(/^(.+?)\s+x?(\d+)$/)
      return match ? { name: match[2] ?? match[1], quantity: match[1] ?? match[2] } : { name: line, quantity: '1' }
    })
}

export async function listMaintenance(): Promise<Snapshot<MaintenanceTemplate[]>> {
  await wait()
  return snapshot(templates)
}

export async function completeMaintenance(templateId: string, idempotencyKey: string): Promise<Operation<MaintenanceTemplate>> {
  await wait(400)
  const template = templates.find((item) => item.id === templateId)
  if (!template) return failedOperation('not_found', false)
  if (template.history.some((entry) => entry.note.includes(idempotencyKey))) return completed(template)
  const nextDue = template.cadence.mode === 'completion_relative' ? daysFromNow(template.cadence.days, 10) : daysFromNow(3, 8)
  const next: MaintenanceTemplate = { ...template, lastCompletedAt: nowIso(), nextTask: { ref: { owner: 'tasks', kind: 'task', id: newId('tsk') }, dueAt: nextDue, state: 'open' }, history: [{ at: nowIso(), note: `Completed · exactly one next occurrence generated (key ${idempotencyKey})` }, ...template.history], revision: template.revision + 1 }
  templates = templates.map((item) => (item.id === templateId ? next : item))
  return completed(next)
}

export async function pauseTemplate(templateId: string, paused: boolean): Promise<Operation<MaintenanceTemplate>> {
  await wait(160)
  const template = templates.find((item) => item.id === templateId)
  if (!template) return failedOperation('not_found', false)
  const next = { ...template, paused, revision: template.revision + 1 }
  templates = templates.map((item) => (item.id === templateId ? next : item))
  return completed(next)
}

export async function createTemplate(draft: Pick<MaintenanceTemplate, 'title' | 'instructions' | 'cadence'>): Promise<Operation<MaintenanceTemplate>> {
  await wait(300)
  if (!draft.title.trim()) return failedOperation('validation', false, 'Name the chore.')
  const template: MaintenanceTemplate = { id: newId('mt'), ...draft, paused: false, history: [], revision: 1, nextTask: { ref: { owner: 'tasks', kind: 'task', id: newId('tsk') }, dueAt: daysFromNow(draft.cadence.mode === 'completion_relative' ? draft.cadence.days : 7, 9), state: 'open' } }
  templates = [...templates, template]
  return completed(template)
}
