import { completed, daysFromNow, failedOperation, newId, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ExperienceIdea, Person } from './types'

let people: Person[] = [
  { id: 'p_1', name: 'Yuki', note: 'Prefers calls to messages. Ask about her mother’s garden.', dates: [{ id: 'd_1', label: 'Birthday', date: daysFromNow(12), annual: true }], reminder: { cadence: 'every 2 weeks', nextAt: daysFromNow(4), taskRef: 'tsk_call_yuki' } },
  { id: 'p_2', name: 'Mum', dates: [{ id: 'd_2', label: 'Birthday', date: daysFromNow(40), annual: true }, { id: 'd_3', label: 'Anniversary', date: daysFromNow(140), annual: true, leapPolicy: 'feb28' }], reminder: { cadence: 'weekly', nextAt: daysFromNow(2) } },
  { id: 'p_3', name: 'Tomás', note: 'Running partner; moved to Lisbon.', dates: [] },
]

let ideas: ExperienceIdea[] = [
  { id: 'e_1', title: 'Night hike under the Perseids', withWhom: 'Tomás', season: 'August' },
  { id: 'e_2', title: 'Ryokan weekend', withWhom: 'Yuki', season: 'spring', requested: { kind: 'calendar', ref: 'blk_ryokan' } },
]

export async function listPeople(): Promise<Snapshot<{ people: Person[]; ideas: ExperienceIdea[] }>> {
  await wait()
  return snapshot({ people, ideas })
}

export async function savePersonNote(id: string, note: string): Promise<Operation<Person>> {
  await wait(200)
  const person = people.find((item) => item.id === id)
  if (!person) return failedOperation('not_found', false)
  person.note = note
  return completed({ ...person })
}

export async function createPerson(name: string): Promise<Operation<Person>> {
  await wait(200)
  if (!name.trim()) return failedOperation('validation', false, 'Name the person.')
  const person: Person = { id: newId('p'), name, dates: [] }
  people = [...people, person]
  return completed(person)
}

export async function createExperienceIdea(title: string, withWhom?: string): Promise<Operation<ExperienceIdea>> {
  await wait(200)
  const idea: ExperienceIdea = { id: newId('e'), title, withWhom }
  ideas = [...ideas, idea]
  return completed(idea)
}

export async function requestTask(ideaId: string): Promise<Operation<ExperienceIdea>> {
  await wait(300)
  const idea = ideas.find((item) => item.id === ideaId)
  if (!idea) return failedOperation('not_found', false)
  idea.requested = { kind: 'task', ref: newId('tsk') }
  return completed({ ...idea })
}
