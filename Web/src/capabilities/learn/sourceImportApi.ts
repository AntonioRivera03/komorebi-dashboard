import type { components } from '../../generated/api'
import { getLearnSession } from './learnApi'
import { uid } from './model'

type Extracted = components['schemas']['ExtractedSource']
type ImportJob = components['schemas']['SourceImportView']

function pause(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 1000)
    signal.addEventListener('abort', abort, { once: true })
  })
}

export async function extractRemote(
  kind: 'website' | 'file',
  input: string | File,
  signal: AbortSignal,
  progress: (message: string) => void,
): Promise<Extracted> {
  const session = await getLearnSession()
  signal.throwIfAborted()
  const headers: Record<string, string> = { 'X-CSRF-Token': session.csrfToken }
  let body: BodyInit
  if (kind === 'website') {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({ url: input })
  } else {
    headers['Idempotency-Key'] = uid()
    const form = new FormData()
    form.append('file', input as File)
    body = form
  }
  const request = async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
      ...init,
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result)
      throw new Error(result?.message ?? 'The source could not be processed. Try again or paste its contents.')
    return result
  }
  const result: Extracted | ImportJob = await request(`/api/v1/learn/sources/${kind}`, {
    method: 'POST', headers, body,
  })
  if (!('id' in result)) return result
  const url = `/api/v1/learn/sources/imports/${encodeURIComponent(result.id)}`
  try {
    let job = result
    const deadline = Date.now() + 10 * 60 * 1000
    while (true) {
      signal.throwIfAborted()
      if (job.status === 'ready' && job.result) return job.result
      if (job.status === 'failed') throw new Error(job.message ?? 'PDF processing failed. Try again.')
      if (Date.now() > deadline)
        throw new Error('Processing is taking too long. Check that the server worker is running, then retry.')
      progress(job.status === 'queued' ? 'Waiting for the server…' : 'Reading PDF and recognizing scanned text…')
      job = await request(url)
      if (job.status === 'queued' || job.status === 'processing') await pause(signal)
    }
  } finally {
    // Also release a completed result: the editable text is now held by the composer.
    // An interrupted connection is covered by the server's one-hour expiry.
    await fetch(url, {
      method: 'DELETE', credentials: 'same-origin', headers: { 'X-CSRF-Token': session.csrfToken },
      signal: AbortSignal.timeout(5000), keepalive: true,
    }).catch(() => {})
  }
}
