import type { ResourceRef } from '../../../shared/contracts/common'

export type ExtractionState = 'queued' | 'extracting' | 'ready' | 'partial' | 'failed'
export type SourceKind = 'url' | 'text' | 'pdf'

export type SourceRevision = {
  revision: number
  createdAt: string
  method: string
  chunkCount: number
  superseded: boolean
}

export type Source = {
  id: string
  title: string
  author?: string
  kind: SourceKind
  location: string
  importedAt: string
  state: ExtractionState
  error?: string
  currentRevision: number
  revisions: SourceRevision[]
  topics: string[]
  aiSummary?: { text: string; generatedAt: string; model: string }
  fileHash?: string
}

export type SourceChunk = {
  id: string
  revision: number
  locator: string
  text: string
  hash: string
}

export type NoteStatus = 'draft' | 'active' | 'archived'
export type RelationType = 'prerequisite' | 'example' | 'contrast' | 'related'

export type NoteRelation = { id: string; type: RelationType; targetId: string; targetTitle: string; why: string; origin: 'manual' | 'connections' }
export type NoteSourceLink = { id: string; sourceId: string; sourceTitle: string; locator: string; revision: number; available: boolean }

export type ConceptNote = {
  id: string
  title: string
  body: string
  status: NoteStatus
  topics: string[]
  openQuestions: string[]
  sourceLinks: NoteSourceLink[]
  relations: NoteRelation[]
  revision: number
  updatedAt: string
  history: { revision: number; at: string; summary: string }[]
  aiEnrichment?: { summary: string; suggestedTags: string[]; generatedAt: string; accepted?: boolean }
}

export type SearchResult = {
  id: string
  kind: 'note' | 'source_chunk'
  title: string
  excerpt: string
  locator?: string
  resource: ResourceRef
  route: string
  score: number
  topics: string[]
}

export type ImportDraft = { kind: SourceKind; title: string; location: string; author?: string }
