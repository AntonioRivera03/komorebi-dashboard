import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { TextInput } from '../../../shared/ui/TextInput'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { usePeople } from '../interfaces/usePeople'
import { createExperienceIdea, createPerson, requestTask, savePersonNote } from '../interfaces/relationshipsApi'
import { ExperienceIdeaRow } from '../components/ExperienceIdeaRow'
import { PersonCard } from '../components/PersonCard'

export default function PeoplePage() {
  const people = usePeople()
  const toast = useToast()
  const [newPerson, setNewPerson] = useState('')
  const [newIdea, setNewIdea] = useState('')
  return (
    <div className="k-page">
      <PageHeader eyebrow="Relationships · M04 · undecided" title="People and experiences" subtitle="Chosen reminders for relationships, recreation and adventures. No ranking, no contact-frequency requirement, no messages sent." actions={<StatusPill tone="warn">undecided</StatusPill>} />
      <AsyncPanel query={people} skeletonLines={8}>
        {({ data }) => (
          <div className="k-grid k-grid--2">
            <div>
              <form
                className="k-row"
                style={{ marginBottom: 16 }}
                onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await createPerson(newPerson)
                  if (result.status === 'completed') {
                    people.mutate((current) => ({ ...current, people: [...current.people, result.value] }))
                    setNewPerson('')
                  }
                }}
              >
                <TextInput value={newPerson} onChange={(event) => setNewPerson(event.target.value)} placeholder="Add a person" aria-label="New person" style={{ flex: 1 }} />
                <Button type="submit" size="sm" disabled={!newPerson.trim()} icon="plus">
                  Add
                </Button>
              </form>
              <div className="k-stack" style={{ gap: 14 }}>
                {data.people.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onSaveNote={async (item, note) => {
                      const result = await savePersonNote(item.id, note)
                      if (result.status === 'completed') people.mutate((current) => ({ ...current, people: current.people.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Panel flush>
                <PanelHead title="Experience ideas" eyebrow="Trips, events, adventures" />
                <form
                  className="k-row"
                  style={{ marginBottom: 8 }}
                  onSubmit={async (event) => {
                    event.preventDefault()
                    const result = await createExperienceIdea(newIdea)
                    if (result.status === 'completed') {
                      people.mutate((current) => ({ ...current, ideas: [...current.ideas, result.value] }))
                      setNewIdea('')
                    }
                  }}
                >
                  <TextInput value={newIdea} onChange={(event) => setNewIdea(event.target.value)} placeholder="An idea worth keeping visible" aria-label="New idea" style={{ flex: 1 }} />
                  <Button type="submit" size="sm" disabled={!newIdea.trim()} icon="plus">
                    Keep
                  </Button>
                </form>
                {data.ideas.map((idea) => (
                  <ExperienceIdeaRow
                    key={idea.id}
                    idea={idea}
                    onRequestTask={async (item) => {
                      const result = await requestTask(item.id)
                      if (result.status === 'completed') {
                        people.mutate((current) => ({ ...current, ideas: current.ideas.map((entry) => (entry.id === item.id ? result.value : entry)) }))
                        toast('Task requested with only the approved title')
                      }
                    }}
                  />
                ))}
              </Panel>
              <div style={{ marginTop: 16 }} className="k-stack">
                <Notice glyph="⛨">A reminder can exist without a contact import; completing it never sends a message and never implies contact happened.</Notice>
                <Notice glyph="※">Annual dates on 29 February follow an explicit leap-day policy.</Notice>
              </div>
            </div>
          </div>
        )}
      </AsyncPanel>
    </div>
  )
}
