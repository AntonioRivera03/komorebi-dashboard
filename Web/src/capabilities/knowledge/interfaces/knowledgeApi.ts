import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { ConceptNote, ImportDraft, RelationType, SearchResult, Source, SourceChunk } from './types'

/* Knowledge HTTP adapter (mock): /api/v1/knowledge/... */

let sources: Source[] = [
  { id: 'src_baddeley', title: 'The episodic buffer: a new component of working memory?', author: 'A. Baddeley (2000)', kind: 'pdf', location: 'baddeley-2000-episodic-buffer.pdf', importedAt: minutesAgo(30000), state: 'ready', currentRevision: 2, revisions: [{ revision: 1, createdAt: minutesAgo(30000), method: 'pdftotext 0.9', chunkCount: 41, superseded: true }, { revision: 2, createdAt: minutesAgo(9000), method: 'pdftotext 1.1 · layout aware', chunkCount: 44, superseded: false }], topics: ['working memory', 'cognition'], aiSummary: { text: 'Proposes a fourth component of working memory, the episodic buffer, as a limited-capacity store that binds information across the loop, sketchpad and long-term memory under central-executive control.', generatedAt: minutesAgo(8900), model: 'claude-fable-5-1' }, fileHash: 'sha256:9f1c…' },
  { id: 'src_ch4', title: 'Chapter 4 lecture notes — Attention and working memory', kind: 'pdf', location: 'chapter-4-lecture-notes.pdf', importedAt: minutesAgo(1500), state: 'failed', error: 'Encrypted PDF. Extraction cannot read the text layer; the original is preserved.', currentRevision: 1, revisions: [{ revision: 1, createdAt: minutesAgo(1500), method: 'pdftotext 1.1', chunkCount: 0, superseded: false }], topics: ['attention'] },
  { id: 'src_freeman', title: 'Active learning increases student performance in STEM', author: 'Freeman et al. (2014)', kind: 'url', location: 'https://www.pnas.org/doi/10.1073/pnas.1319030111', importedAt: minutesAgo(400), state: 'extracting', currentRevision: 1, revisions: [{ revision: 1, createdAt: minutesAgo(400), method: 'readability 2.3', chunkCount: 0, superseded: false }], topics: ['learning science'] },
  { id: 'src_irodori', title: 'Irodori A2 — Unit 3: at a restaurant', author: 'Japan Foundation', kind: 'url', location: 'https://www.irodori.jpf.go.jp/en/', importedAt: minutesAgo(20000), state: 'partial', error: '2 of 14 pages contained only images; OCR is a later adapter.', currentRevision: 1, revisions: [{ revision: 1, createdAt: minutesAgo(20000), method: 'readability 2.3', chunkCount: 12, superseded: false }], topics: ['japanese'] },
  { id: 'src_pinhole', title: 'Camera obscura and pinhole projection', kind: 'text', location: 'pasted text', importedAt: minutesAgo(50000), state: 'ready', currentRevision: 1, revisions: [{ revision: 1, createdAt: minutesAgo(50000), method: 'plain text', chunkCount: 6, superseded: false }], topics: ['optics', 'komorebi'] },
  { id: 'src_queued', title: 'Cowan (2001) — The magical number 4', author: 'N. Cowan', kind: 'pdf', location: 'cowan-2001.pdf', importedAt: minutesAgo(5), state: 'queued', currentRevision: 1, revisions: [{ revision: 1, createdAt: minutesAgo(5), method: 'pdftotext 1.1', chunkCount: 0, superseded: false }], topics: ['working memory'] },
]

const chunks: Record<string, SourceChunk[]> = {
  src_baddeley: [
    { id: 'chk_bad_1998', revision: 2, locator: 'p. 418 §1', text: 'The central executive is assumed to be an attentional control system, with no storage capacity of its own, that coordinates the two slave systems.', hash: 'h1' },
    { id: 'chk_bad_1999', revision: 2, locator: 'p. 419 §3', text: 'The phonological loop comprises a phonological store and an articulatory rehearsal process; the visuospatial sketchpad holds visual and spatial information.', hash: 'h2' },
    { id: 'chk_bad_2001', revision: 2, locator: 'p. 421 §2', text: 'The episodic buffer is assumed to be a limited-capacity temporary storage system that is capable of integrating information from a variety of sources.', hash: 'h3' },
    { id: 'chk_bad_2002', revision: 2, locator: 'p. 421 §4', text: 'It is assumed to be controlled by the central executive, which is capable of retrieving information from the store in the form of conscious awareness.', hash: 'h4' },
    { id: 'chk_bad_2003', revision: 2, locator: 'p. 423 §1', text: 'Binding is the key function: the buffer provides a mechanism for chunking, allowing the limited capacity to be used more effectively.', hash: 'h5' },
  ],
  src_pinhole: [
    { id: 'chk_pin_1', revision: 1, locator: '¶1', text: 'Light travels in straight lines; a small aperture lets only a narrow bundle of rays from each point of a scene reach a surface, forming an inverted image.', hash: 'p1' },
    { id: 'chk_pin_2', revision: 1, locator: '¶2', text: 'Gaps between leaves act as many irregular pinholes. Each projects a dim image of the sun; during an eclipse the projected discs become crescents.', hash: 'p2' },
  ],
  src_irodori: [{ id: 'chk_iro_1', revision: 1, locator: 'Unit 3 · dialogue 2', text: 'すみません、メニューをお願いします。— Excuse me, the menu please.', hash: 'i1' }],
}

let notes: ConceptNote[] = [
  {
    id: 'note_wm',
    title: 'Working memory is a control system, not a box',
    body: 'Baddeley’s model has three stores plus an executive that stores nothing. The executive allocates attention between the phonological loop and the visuospatial sketchpad. The episodic buffer (added 2000) is the part I keep confusing: it is a store, limited capacity, but its job is binding — chunking across sources — under executive control.\n\nMy own test: if the executive had storage, you could not explain dual-task costs cleanly.',
    status: 'active',
    topics: ['working memory', 'cognition'],
    openQuestions: ['Is the episodic buffer better described as a store or a process?', 'How does Cowan’s embedded-process view map onto the buffer?'],
    sourceLinks: [
      { id: 'sl_1', sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 418 §1', revision: 2, available: true },
      { id: 'sl_2', sourceId: 'src_baddeley', sourceTitle: 'Baddeley (2000)', locator: 'p. 421 §2', revision: 2, available: true },
      { id: 'sl_3', sourceId: 'src_deleted', sourceTitle: '(source removed)', locator: 'p. 12', revision: 1, available: false },
    ],
    relations: [
      { id: 'rel_1', type: 'prerequisite', targetId: 'note_attention', targetTitle: 'Attention as selection under capacity limits', why: 'The executive is an attentional controller; attention must come first.', origin: 'manual' },
      { id: 'rel_2', type: 'related', targetId: 'note_stale', targetTitle: 'Stale vs unknown is not the same as false', why: 'Both are about representing absence of evidence honestly.', origin: 'connections' },
    ],
    revision: 5,
    updatedAt: minutesAgo(700),
    history: [{ revision: 5, at: minutesAgo(700), summary: 'Added the dual-task test' }, { revision: 4, at: minutesAgo(3000), summary: 'Linked p. 421' }, { revision: 3, at: minutesAgo(9000), summary: 'Rewrote intro in my words' }],
    aiEnrichment: { summary: 'Distinguishes storage components from the attentional controller and frames the episodic buffer as a binding mechanism.', suggestedTags: ['binding', 'dual-task'], generatedAt: minutesAgo(650) },
  },
  { id: 'note_attention', title: 'Attention as selection under capacity limits', body: 'Selection happens early or late depending on load. Perceptual load theory: high load = early filtering; low load = distractors get processed.', status: 'active', topics: ['attention', 'cognition'], openQuestions: [], sourceLinks: [{ id: 'sl_4', sourceId: 'src_ch4', sourceTitle: 'Chapter 4 lecture notes', locator: 'slide 12', revision: 1, available: true }], relations: [], revision: 2, updatedAt: minutesAgo(5000), history: [{ revision: 2, at: minutesAgo(5000), summary: 'Added load theory' }] },
  { id: 'note_stale', title: 'Stale vs unknown is not the same as false', body: 'A missing observation is not evidence of a negative state. A sensor that stopped reporting is "unknown", not "safe". The same applies to memory: no evidence for a preference is not evidence against it.', status: 'active', topics: ['systems', 'komorebi'], openQuestions: ['Where does hysteresis belong: in the rule or in the observation?'], sourceLinks: [], relations: [{ id: 'rel_3', type: 'contrast', targetId: 'note_wm', targetTitle: 'Working memory is a control system, not a box', why: 'Contrast: a store that is empty vs a store we cannot observe.', origin: 'connections' }], revision: 3, updatedAt: minutesAgo(600), history: [{ revision: 3, at: minutesAgo(600), summary: 'Added memory analogy' }] },
  { id: 'note_komorebi', title: 'Why leaf gaps make crescents', body: 'Draft. Each gap is a pinhole; each pinhole projects the sun. Normally the discs overlap into dappled light. In an eclipse the sun is a crescent, so every disc is a crescent.', status: 'draft', topics: ['optics', 'komorebi'], openQuestions: ['Why are the projected discs so much larger than the gaps?'], sourceLinks: [{ id: 'sl_5', sourceId: 'src_pinhole', sourceTitle: 'Camera obscura and pinhole projection', locator: '¶2', revision: 1, available: true }], relations: [], revision: 1, updatedAt: minutesAgo(40000), history: [{ revision: 1, at: minutesAgo(40000), summary: 'Created from capture' }] },
  { id: 'note_menu', title: 'Ordering at a restaurant (Japanese)', body: 'すみません to get attention. 〜をお願いします to order. 〜はありますか to ask if they have something.', status: 'active', topics: ['japanese'], openQuestions: ['Polite way to ask for the bill at an izakaya?'], sourceLinks: [{ id: 'sl_6', sourceId: 'src_irodori', sourceTitle: 'Irodori A2 — Unit 3', locator: 'Unit 3 · dialogue 2', revision: 1, available: true }], relations: [], revision: 2, updatedAt: minutesAgo(12000), history: [{ revision: 2, at: minutesAgo(12000), summary: 'Added ありますか' }] },
]

export async function listSources(): Promise<Snapshot<Source[]>> {
  await wait()
  return snapshot([...sources].sort((a, b) => b.importedAt.localeCompare(a.importedAt)))
}

export async function getSource(id: string): Promise<Snapshot<{ source: Source; chunks: SourceChunk[] }> | null> {
  await wait(200)
  const source = sources.find((item) => item.id === id)
  if (!source) return null
  return snapshot({ source, chunks: (chunks[id] ?? []).filter((chunk) => chunk.revision === source.currentRevision) })
}

export async function importSource(draft: ImportDraft, idempotencyKey: string): Promise<Operation<Source>> {
  await wait(320)
  const existing = sources.find((item) => item.id === idempotencyKey)
  if (existing) return completed(existing)
  if (!draft.location.trim()) return failedOperation('validation', false, 'Add a URL, text or a file.')
  if (draft.kind === 'url' && /^(https?:\/\/)?(localhost|127\.|10\.|192\.168\.)/i.test(draft.location)) return failedOperation('unsafe_url', false, 'Private-network URLs are rejected by the server fetcher.')
  const source: Source = { id: newId('src'), title: draft.title || draft.location.slice(0, 60), author: draft.author, kind: draft.kind, location: draft.location, importedAt: nowIso(), state: 'queued', currentRevision: 1, revisions: [{ revision: 1, createdAt: nowIso(), method: draft.kind === 'pdf' ? 'pdftotext 1.1' : draft.kind === 'url' ? 'readability 2.3' : 'plain text', chunkCount: 0, superseded: false }], topics: [] }
  sources = [source, ...sources]
  window.setTimeout(() => {
    sources = sources.map((item) => (item.id === source.id ? { ...item, state: 'extracting' } : item))
  }, 1200)
  window.setTimeout(() => {
    sources = sources.map((item) => (item.id === source.id ? { ...item, state: 'ready', revisions: item.revisions.map((rev) => ({ ...rev, chunkCount: 7 })) } : item))
  }, 4000)
  return completed(source)
}

export async function reextractSource(id: string): Promise<Operation<Source>> {
  await wait(500)
  const source = sources.find((item) => item.id === id)
  if (!source) return failedOperation('not_found', false)
  if (source.error?.includes('Encrypted')) return failedOperation('extraction_failed', true, 'Still encrypted. Provide an unlocked copy to create a new revision.')
  const revision = source.currentRevision + 1
  const next: Source = { ...source, state: 'extracting', currentRevision: revision, revisions: [...source.revisions.map((rev) => ({ ...rev, superseded: true })), { revision, createdAt: nowIso(), method: 'pdftotext 1.1 · layout aware', chunkCount: 0, superseded: false }] }
  sources = sources.map((item) => (item.id === id ? next : item))
  return completed(next)
}

export async function deleteSource(id: string): Promise<Operation<void>> {
  await wait(300)
  sources = sources.filter((item) => item.id !== id)
  notes = notes.map((note) => ({ ...note, sourceLinks: note.sourceLinks.map((link) => (link.sourceId === id ? { ...link, available: false, sourceTitle: '(source removed)' } : link)) }))
  return completed(undefined)
}

export async function listNotes(): Promise<Snapshot<ConceptNote[]>> {
  await wait()
  return snapshot([...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
}

export async function getNote(id: string): Promise<Snapshot<ConceptNote> | null> {
  await wait(180)
  const note = notes.find((item) => item.id === id)
  return note ? snapshot(note) : null
}

export async function createNote(title: string, body: string, topics: string[]): Promise<Operation<ConceptNote>> {
  await wait(260)
  if (!title.trim()) return failedOperation('validation', false, 'A note needs a title.')
  const note: ConceptNote = { id: newId('note'), title, body, status: 'draft', topics, openQuestions: [], sourceLinks: [], relations: [], revision: 1, updatedAt: nowIso(), history: [{ revision: 1, at: nowIso(), summary: 'Created' }] }
  notes = [note, ...notes]
  return completed(note)
}

export async function reviseNote(id: string, patch: Partial<Pick<ConceptNote, 'title' | 'body' | 'topics' | 'openQuestions' | 'status'>>, expectedRevision: number, summary: string): Promise<Operation<ConceptNote>> {
  await wait(260)
  const note = notes.find((item) => item.id === id)
  if (!note) return failedOperation('not_found', false)
  if (note.revision !== expectedRevision) return failedOperation('revision_conflict', false, 'This note was revised elsewhere. Reload to see the newer revision.')
  const next: ConceptNote = { ...note, ...patch, revision: note.revision + 1, updatedAt: nowIso(), history: [{ revision: note.revision + 1, at: nowIso(), summary }, ...note.history] }
  notes = notes.map((item) => (item.id === id ? next : item))
  return completed(next)
}

export async function addRelation(id: string, type: RelationType, targetId: string, why: string): Promise<Operation<ConceptNote>> {
  await wait(220)
  const note = notes.find((item) => item.id === id)
  const target = notes.find((item) => item.id === targetId)
  if (!note || !target) return failedOperation('not_found', false)
  if (note.relations.some((rel) => rel.targetId === targetId && rel.type === type)) return completed(note)
  const next: ConceptNote = { ...note, relations: [...note.relations, { id: newId('rel'), type, targetId, targetTitle: target.title, why, origin: 'manual' }], revision: note.revision + 1, updatedAt: nowIso() }
  notes = notes.map((item) => (item.id === id ? next : item))
  return completed(next)
}

export async function acceptEnrichment(id: string): Promise<Operation<ConceptNote>> {
  await wait(160)
  const note = notes.find((item) => item.id === id)
  if (!note || !note.aiEnrichment) return failedOperation('not_found', false)
  const next: ConceptNote = { ...note, topics: Array.from(new Set([...note.topics, ...note.aiEnrichment.suggestedTags])), aiEnrichment: { ...note.aiEnrichment, accepted: true }, revision: note.revision + 1, updatedAt: nowIso(), history: [{ revision: note.revision + 1, at: nowIso(), summary: 'Accepted AI tags' }, ...note.history] }
  notes = notes.map((item) => (item.id === id ? next : item))
  return completed(next)
}

export async function search(query: string, scope: 'all' | 'notes' | 'sources', topic?: string): Promise<Snapshot<SearchResult[]>> {
  await wait(380)
  const needle = query.trim().toLowerCase()
  const results: SearchResult[] = []
  if (scope !== 'sources') {
    for (const note of notes) {
      if (note.status === 'archived') continue
      if (topic && !note.topics.includes(topic)) continue
      const hay = `${note.title} ${note.body} ${note.openQuestions.join(' ')}`.toLowerCase()
      if (!needle || hay.includes(needle)) {
        const index = hay.indexOf(needle)
        results.push({ id: `r_${note.id}`, kind: 'note', title: note.title, excerpt: needle ? note.body.slice(Math.max(0, index - 60), index + 120) : note.body.slice(0, 160), resource: { owner: 'knowledge', kind: 'concept_note', id: note.id, revision: note.revision }, route: `/learn/notes/${note.id}`, score: needle ? 0.9 : 0.5, topics: note.topics })
      }
    }
  }
  if (scope !== 'notes') {
    for (const [sourceId, list] of Object.entries(chunks)) {
      const source = sources.find((item) => item.id === sourceId)
      if (!source || source.state === 'failed') continue
      if (topic && !source.topics.includes(topic)) continue
      for (const chunk of list) {
        if (chunk.revision !== source.currentRevision) continue
        if (!needle || chunk.text.toLowerCase().includes(needle)) {
          results.push({ id: `r_${chunk.id}`, kind: 'source_chunk', title: source.title, excerpt: chunk.text, locator: chunk.locator, resource: { owner: 'knowledge', kind: 'source_chunk', id: chunk.id, revision: chunk.revision }, route: `/learn/library/${sourceId}`, score: needle ? 0.8 : 0.4, topics: source.topics })
        }
      }
    }
  }
  return snapshot(results.sort((a, b) => b.score - a.score).slice(0, 25))
}

export async function listTopics(): Promise<string[]> {
  await wait(60)
  return Array.from(new Set([...notes.flatMap((note) => note.topics), ...sources.flatMap((source) => source.topics)])).sort()
}
