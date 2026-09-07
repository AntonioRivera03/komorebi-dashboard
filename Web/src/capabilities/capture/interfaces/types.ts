import type { ResourceRef } from '../../../shared/contracts/common'

export type CaptureKind = 'text' | 'url' | 'file'
export type CaptureOrigin = 'typed' | 'voice' | 'briefing' | 'share'
export type CaptureState = 'unprocessed' | 'converted' | 'archived'
export type DestinationKind = 'task' | 'note' | 'source'

export type ConversionOperation = {
  id: string
  captureId: string
  destinationKind: DestinationKind
  status: 'pending' | 'completed' | 'failed'
  resultRef?: ResourceRef
  error?: string
  attempts: number
}

export type CaptureSuggestion = {
  destination: DestinationKind
  title: string
  reason: string
  confidence: 'low' | 'medium' | 'high'
  candidateActions?: string[]
  decision?: 'accepted' | 'edited' | 'rejected'
}

export type CaptureItem = {
  id: string
  body: string
  kind: CaptureKind
  attachmentRefs: string[]
  origin: CaptureOrigin
  transcriptRef?: string
  state: CaptureState
  revision: number
  createdAt: string
  suggestion?: CaptureSuggestion | { status: 'pending' } | { status: 'failed'; error: string }
  conversion?: ConversionOperation
}

export type ConversionPreview = {
  destination: DestinationKind
  title: string
  content: string
  notes: string[]
}
