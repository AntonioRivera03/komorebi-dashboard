import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Tag } from '../../../shared/ui/Tag'
import { routes } from '../../../shared/lib/routes'
import { useNotes } from '../interfaces/useNotes'
import { useTopics } from '../interfaces/useTopics'
import { NoteCard } from '../components/NoteCard'
import { NoteComposerDialog } from '../components/NoteComposerDialog'

export default function NotesPage() {
  const notes = useNotes()
  const topics = useTopics()
  const navigate = useNavigate()
  const [composing, setComposing] = useState(false)
  const [topic, setTopic] = useState<string | null>(null)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Knowledge · L02"
        title="Notes"
        subtitle="Explanations in your own words, with source references, typed links and marked open questions."
        actions={
          <>
            <Link to={routes.librarySearch}>
              <Button icon="search">Search</Button>
            </Link>
            <Button variant="primary" icon="plus" onClick={() => setComposing(true)}>
              New note
            </Button>
          </>
        }
      />
      <div className="k-row" style={{ marginBottom: 18 }}>
        <button type="button" className="k-pill" aria-pressed={topic === null} onClick={() => setTopic(null)} style={topic === null ? { background: 'var(--accent)', color: 'var(--onaccent)', borderColor: 'var(--accent)' } : undefined}>
          every topic
        </button>
        {topics.map((item) => (
          <button key={item} type="button" className="k-pill" aria-pressed={topic === item} onClick={() => setTopic(item)} style={topic === item ? { background: 'var(--accent)', color: 'var(--onaccent)', borderColor: 'var(--accent)' } : undefined}>
            {item}
          </button>
        ))}
      </div>
      <AsyncPanel query={notes} isEmpty={(data) => data.filter((note) => !topic || note.topics.includes(topic)).length === 0} empty={<EmptyState glyph="✎" title="Nothing written yet">A note is a claim you can defend, tied to where you read it.</EmptyState>} skeletonLines={6}>
        {({ data }) => (
          <div className="k-grid k-grid--cards">
            {data
              .filter((note) => !topic || note.topics.includes(topic))
              .map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
          </div>
        )}
      </AsyncPanel>
      <div style={{ marginTop: 24 }} className="k-row">
        <span className="label">Archived notes are hidden but kept.</span>
        <Tag outline>archive ≠ delete</Tag>
      </div>
      <NoteComposerDialog open={composing} onClose={() => setComposing(false)} onCreated={(note) => navigate(`${routes.notes}/${note.id}`)} />
    </div>
  )
}
