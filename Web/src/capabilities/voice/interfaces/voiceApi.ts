import { completed, minutesAgo, newId, nowIso, wait } from '../../../shared/api/mock'
import type { Operation } from '../../../shared/contracts/common'
import type { RoutedOperation, SupportedCommand, VoiceCapability, VoiceRequest } from './types'

/* Voice HTTP adapter (mock): /api/v1/voice/... */

const samples = [
  { text: 'remember to ask the landlord about the radiator noise', confidence: 0.93 },
  { text: 'set the living room to evening', confidence: 0.88 },
  { text: 'what did I say I found confusing about working memory last week', confidence: 0.71 },
  { text: 'add oat milk to the shopping list', confidence: 0.96 },
]

export const supportedCommands: SupportedCommand[] = [
  { pattern: 'remember / note / capture …', target: 'capture', example: '“Remember to ask about the radiator”', confirmation: 'none' },
  { pattern: 'add … to the shopping list', target: 'capture', example: '“Add oat milk to the shopping list”', confirmation: 'none' },
  { pattern: 'set <room> to <scene>', target: 'home', example: '“Set the living room to evening”', confirmation: 'none' },
  { pattern: 'anything else', target: 'assistant', example: '“What did I find confusing last week?”', confirmation: 'preview' },
]

let recent: VoiceRequest[] = [
  { id: 'vr_881', createdAt: minutesAgo(600), phase: 'done', transcript: 'the stale versus unknown distinction in home state is the same problem as no evidence versus negative evidence in memory', confidence: 0.82, revisions: [], routed: { target: 'capture', label: 'Captured to inbox', operationId: 'op_v1', status: 'confirmed', route: '/capture/cap_3' }, audioRetained: false },
  { id: 'vr_880', createdAt: minutesAgo(1500), phase: 'done', transcript: 'set the bedroom to night', confidence: 0.91, revisions: [], routed: { target: 'home', label: 'Scene “Night” applied in Bedroom', operationId: 'op_v2', status: 'confirmed', route: '/home/scenes' }, audioRetained: false },
  { id: 'vr_879', createdAt: minutesAgo(3000), phase: 'failed', transcript: undefined, confidence: undefined, revisions: [], audioRetained: false, error: 'Transcription provider timed out. Nothing was executed.' },
]

export async function getVoiceCapability(): Promise<VoiceCapability> {
  await wait(120)
  const supported = typeof navigator !== 'undefined' && 'mediaDevices' in navigator
  return { microphone: supported ? 'prompt' : 'unavailable', transcriptionProvider: 'ready', retention: 'delete_after_transcription' }
}

export async function startVoiceSession(): Promise<VoiceRequest> {
  await wait(80)
  return { id: newId('vr'), createdAt: nowIso(), phase: 'listening', revisions: [], audioRetained: false }
}

export async function transcribe(request: VoiceRequest): Promise<VoiceRequest> {
  await wait(1100)
  const sample = samples[Math.floor(Math.random() * samples.length)]
  const next: VoiceRequest = { ...request, phase: 'review', transcript: sample.text, confidence: sample.confidence }
  return next
}

function interpret(transcript: string): RoutedOperation {
  const text = transcript.toLowerCase()
  if (/^(remember|note|capture)/.test(text) || /shopping list/.test(text)) {
    return { target: 'capture', label: 'Captured to inbox', operationId: newId('op'), status: 'confirmed', route: '/capture' }
  }
  const scene = text.match(/set (?:the )?(\w+(?: \w+)?) to (\w+)/)
  if (scene) {
    return { target: 'home', label: `Scene “${scene[2]}” requested in ${scene[1]}`, operationId: newId('op'), status: 'acknowledged', route: '/home/scenes' }
  }
  return { target: 'assistant', label: 'Handed to the assistant for a preview', operationId: newId('op'), status: 'needs_confirmation', route: '/assistant' }
}

export async function routeRequest(request: VoiceRequest, transcript: string, idempotencyKey: string): Promise<Operation<VoiceRequest>> {
  await wait(700)
  const already = recent.find((item) => item.id === idempotencyKey)
  if (already) return completed(already)
  const routed = interpret(transcript)
  const next: VoiceRequest = { ...request, id: idempotencyKey, phase: 'done', transcript, revisions: request.transcript && request.transcript !== transcript ? [...request.revisions, request.transcript] : request.revisions, routed }
  recent = [next, ...recent]
  return completed(next)
}

export async function listRecentRequests(): Promise<VoiceRequest[]> {
  await wait(160)
  return recent
}
