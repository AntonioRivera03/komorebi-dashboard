import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { CaptureItem, CaptureKind, CaptureOrigin, CaptureState, ConversionPreview, DestinationKind } from './types'

/* Capture HTTP adapter (mock): /api/v1/capture/... */

let items: CaptureItem[] = [
  {
    id: 'cap_1',
    body: 'Ask Yuki whether the Irodori A2 dialogues cover ordering at an izakaya — if not, find a second source.',
    kind: 'text',
    attachmentRefs: [],
    origin: 'typed',
    state: 'unprocessed',
    revision: 1,
    createdAt: minutesAgo(35),
    suggestion: { destination: 'task', title: 'Ask Yuki about izakaya dialogues in Irodori A2', reason: 'Reads as a request to another person with a follow-up step; matches your Japanese skill target “order at a restaurant”.', confidence: 'high', candidateActions: ['Message Yuki about Irodori A2 coverage', 'Search for a second izakaya dialogue source'] },
  },
  {
    id: 'cap_2',
    body: 'https://www.pnas.org/doi/10.1073/pnas.1319030111',
    kind: 'url',
    attachmentRefs: [],
    origin: 'briefing',
    state: 'unprocessed',
    revision: 1,
    createdAt: minutesAgo(190),
    suggestion: { destination: 'source', title: 'Active learning increases student performance in STEM (Freeman et al.)', reason: 'A URL to a paper; you have three notes on retrieval practice that cite meta-analyses.', confidence: 'medium' },
  },
  {
    id: 'cap_3',
    body: 'Thought: the “stale vs unknown” distinction in home state is the same problem as “no evidence vs negative evidence” in the memory module.',
    kind: 'text',
    attachmentRefs: [],
    origin: 'voice',
    transcriptRef: 'vr_881',
    state: 'unprocessed',
    revision: 2,
    createdAt: minutesAgo(600),
    suggestion: { status: 'pending' },
  },
  {
    id: 'cap_4',
    body: 'Radiator in the bedroom is making a knocking sound in the morning.',
    kind: 'text',
    attachmentRefs: ['file_radiator_photo'],
    origin: 'typed',
    state: 'converted',
    revision: 1,
    createdAt: minutesAgo(4200),
    conversion: { id: 'conv_4', captureId: 'cap_4', destinationKind: 'task', status: 'completed', resultRef: { owner: 'tasks', kind: 'task', id: 'tsk_3' }, attempts: 1 },
    suggestion: { destination: 'task', title: 'Reply to landlord about radiator', reason: 'A household issue that needs someone else to act.', confidence: 'high', decision: 'edited' },
  },
  {
    id: 'cap_5',
    body: 'chapter-4-lecture-notes.pdf',
    kind: 'file',
    attachmentRefs: ['file_ch4_pdf'],
    origin: 'share',
    state: 'unprocessed',
    revision: 1,
    createdAt: minutesAgo(1500),
    conversion: { id: 'conv_5', captureId: 'cap_5', destinationKind: 'source', status: 'failed', error: 'Extraction failed: encrypted PDF. The captured file reference is preserved.', attempts: 2 },
    suggestion: { status: 'failed', error: 'Model request interrupted. The capture is still available; retry when ready.' },
  },
  {
    id: 'cap_6',
    body: 'Maybe try a 20-minute study block right after the evening walk instead of late.',
    kind: 'text',
    attachmentRefs: [],
    origin: 'typed',
    state: 'archived',
    revision: 1,
    createdAt: minutesAgo(9000),
  },
]

const captureKeys = new Map<string, string>()

function detectKind(body: string): CaptureKind {
  if (/^https?:\/\//i.test(body.trim())) return 'url'
  if (/\.(pdf|md|txt|docx?)$/i.test(body.trim())) return 'file'
  return 'text'
}

export async function listInbox(state: CaptureState): Promise<Snapshot<CaptureItem[]>> {
  await wait()
  return snapshot(items.filter((item) => item.state === state).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function getCapture(id: string): Promise<CaptureItem | null> {
  await wait(120)
  return items.find((item) => item.id === id) ?? null
}

export async function captureItem(body: string, origin: CaptureOrigin, idempotencyKey: string, transcriptRef?: string): Promise<Operation<CaptureItem>> {
  await wait(260)
  const existingId = captureKeys.get(idempotencyKey)
  if (existingId) return completed(items.find((item) => item.id === existingId) as CaptureItem)
  if (!body.trim()) return failedOperation('validation', false, 'Nothing to capture.')
  const kind = detectKind(body)
  const item: CaptureItem = {
    id: newId('cap'),
    body: body.trim(),
    kind,
    attachmentRefs: kind === 'file' ? [newId('file')] : [],
    origin,
    transcriptRef,
    state: 'unprocessed',
    revision: 1,
    createdAt: nowIso(),
    suggestion: { status: 'pending' },
  }
  items = [item, ...items]
  captureKeys.set(idempotencyKey, item.id)
  // AI interpretation runs as a job; the capture is saved regardless of its outcome.
  window.setTimeout(() => {
    items = items.map((current) =>
      current.id === item.id
        ? {
            ...current,
            suggestion: {
              destination: kind === 'url' || kind === 'file' ? 'source' : /\?$/.test(body.trim()) ? 'note' : 'task',
              title: body.trim().slice(0, 64),
              reason: kind === 'text' ? 'Phrased as something to do; no deadline detected.' : 'A reference worth importing with its original location.',
              confidence: 'medium',
            },
          }
        : current,
    )
  }, 1800)
  return completed(item)
}

export async function updateCapture(id: string, body: string, expectedRevision: number): Promise<Operation<CaptureItem>> {
  await wait(200)
  const item = items.find((current) => current.id === id)
  if (!item) return failedOperation('not_found', false)
  if (item.revision !== expectedRevision) return failedOperation('revision_conflict', false, 'The capture changed since you opened it.')
  const next = { ...item, body, revision: item.revision + 1 }
  items = items.map((current) => (current.id === id ? next : current))
  return completed(next)
}

export async function archiveCapture(id: string): Promise<Operation<CaptureItem>> {
  await wait(160)
  const item = items.find((current) => current.id === id)
  if (!item) return failedOperation('not_found', false)
  const next: CaptureItem = { ...item, state: 'archived', revision: item.revision + 1 }
  items = items.map((current) => (current.id === id ? next : current))
  return completed(next)
}

export async function previewConversion(id: string, destination: DestinationKind): Promise<ConversionPreview> {
  await wait(300)
  const item = items.find((current) => current.id === id)
  const suggestion = item?.suggestion && 'destination' in item.suggestion ? item.suggestion : undefined
  const title = suggestion?.title ?? item?.body.slice(0, 60) ?? ''
  return {
    destination,
    title,
    content: item?.body ?? '',
    notes:
      destination === 'source'
        ? ['Extraction runs as a background job; the source shows as queued until it finishes.', 'Unsupported or encrypted files keep the original with an error.']
        : destination === 'note'
          ? ['The note will link back to this capture as provenance.', 'Nothing is auto-enrolled for review.']
          : ['The task gets no deadline unless you set one.', 'The original capture stays until you delete it.'],
  }
}

export async function convertCapture(id: string, destination: DestinationKind): Promise<Operation<CaptureItem>> {
  await wait(380)
  const item = items.find((current) => current.id === id)
  if (!item) return failedOperation('not_found', false)
  const existing = item.conversion
  if (existing && existing.status === 'completed') return completed(item)
  const conversionId = existing?.id ?? newId('conv')
  const attempts = (existing?.attempts ?? 0) + 1
  // Simulate one lost response for encrypted files on the first two attempts.
  const shouldFail = item.kind === 'file' && attempts < 3
  const conversion = shouldFail
    ? { id: conversionId, captureId: id, destinationKind: destination, status: 'failed' as const, error: 'Extraction failed: encrypted PDF. The captured file reference is preserved.', attempts }
    : { id: conversionId, captureId: id, destinationKind: destination, status: 'completed' as const, resultRef: { owner: destination === 'task' ? 'tasks' : 'knowledge', kind: destination, id: newId(destination === 'task' ? 'tsk' : destination === 'note' ? 'note' : 'src') }, attempts }
  const next: CaptureItem = {
    ...item,
    conversion,
    state: conversion.status === 'completed' ? 'converted' : item.state,
    revision: item.revision + 1,
    suggestion: item.suggestion && 'destination' in item.suggestion ? { ...item.suggestion, decision: item.suggestion.destination === destination ? 'accepted' : 'edited' } : item.suggestion,
  }
  items = items.map((current) => (current.id === id ? next : current))
  return completed(next)
}

export async function rejectSuggestion(id: string): Promise<Operation<CaptureItem>> {
  await wait(120)
  const item = items.find((current) => current.id === id)
  if (!item || !item.suggestion || !('destination' in item.suggestion)) return failedOperation('not_found', false)
  const next: CaptureItem = { ...item, suggestion: { ...item.suggestion, decision: 'rejected' } }
  items = items.map((current) => (current.id === id ? next : current))
  return completed(next)
}

export async function inboxCount(): Promise<number> {
  await wait(60)
  return items.filter((item) => item.state === 'unprocessed').length
}
