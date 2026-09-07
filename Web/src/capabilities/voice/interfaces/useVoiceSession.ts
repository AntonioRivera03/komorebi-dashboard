import { useCallback, useState } from 'react'
import { newId } from '../../../shared/api/mock'
import { routeRequest, startVoiceSession, transcribe } from './voiceApi'
import type { VoiceRequest } from './types'

/**
 * Drives one intentional push-to-talk session:
 * idle → listening → transcribing → review → routing → done | failed.
 */
export function useVoiceSession() {
  const [request, setRequest] = useState<VoiceRequest | null>(null)
  const [draft, setDraft] = useState('')

  const begin = useCallback(async () => {
    const started = await startVoiceSession()
    setRequest(started)
    setDraft('')
  }, [])

  const stop = useCallback(async () => {
    setRequest((current) => (current ? { ...current, phase: 'transcribing' } : current))
    const current = request
    if (!current) return
    try {
      const reviewed = await transcribe(current)
      setRequest(reviewed)
      setDraft(reviewed.transcript ?? '')
    } catch (error) {
      setRequest({ ...current, phase: 'failed', error: error instanceof Error ? error.message : 'Transcription failed' })
    }
  }, [request])

  const route = useCallback(async () => {
    if (!request) return
    setRequest({ ...request, phase: 'routing' })
    const result = await routeRequest(request, draft, request.id.startsWith('vr_') ? request.id : newId('vr'))
    if (result.status === 'completed') setRequest(result.value)
    else setRequest({ ...request, phase: 'failed', error: result.status === 'failed' ? result.message : 'Routing pending' })
  }, [request, draft])

  const reset = useCallback(() => {
    setRequest(null)
    setDraft('')
  }, [])

  return { request, draft, setDraft, begin, stop, route, reset }
}
