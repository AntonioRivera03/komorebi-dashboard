export type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'review' | 'routing' | 'done' | 'failed' | 'unsupported'

export type RouteTarget = 'capture' | 'home' | 'assistant'

export type RoutedOperation = {
  target: RouteTarget
  label: string
  operationId: string
  status: 'accepted' | 'acknowledged' | 'confirmed' | 'failed' | 'needs_confirmation'
  route?: string
}

export type VoiceRequest = {
  id: string
  createdAt: string
  phase: VoicePhase
  transcript?: string
  confidence?: number
  revisions: string[]
  routed?: RoutedOperation
  audioRetained: boolean
  error?: string
}

export type VoiceCapability = {
  microphone: 'granted' | 'prompt' | 'denied' | 'unavailable'
  transcriptionProvider: 'ready' | 'unconfigured' | 'unavailable'
  retention: 'delete_after_transcription' | 'keep_on_save'
}

export type SupportedCommand = { pattern: string; target: RouteTarget; example: string; confirmation: 'none' | 'preview' }
