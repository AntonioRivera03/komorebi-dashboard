import type { components } from '../../generated/api'
import type { LearnState } from './model'

export type LearnWorkspace = Omit<LearnState, 'focus' | 'focusSoundEnabled'>
export type LearnSession = Pick<
  components['schemas']['SessionView'],
  'actorId' | 'displayName' | 'principal' | 'csrfToken'
>
export class LearnApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
export function workspaceOf(state: LearnState): LearnWorkspace {
  const { focus: _focus, focusSoundEnabled: _sound, ...workspace } = state
  return workspace satisfies components['schemas']['LearnWorkspace']
}
export async function learnRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, {
    credentials: 'same-origin',
    signal: AbortSignal.timeout(30000),
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new LearnApiError(
      response.status,
      error?.code ?? 'unavailable',
      response.status === 422
        ? 'Some learning data is invalid or exceeds the workspace limit. Export a copy before adjusting it.'
        : (error?.message ?? 'The learning server is unavailable.'),
    )
  }
  return response.status === 204 ? (undefined as T) : response.json()
}
export const getLearnSession = () => learnRequest<LearnSession>('core/session')
export const loginLearn = (ticket: string) =>
  learnRequest<LearnSession>('core/session', {
    method: 'POST',
    body: JSON.stringify({ ticket }),
  })
export const loadWorkspace = () =>
  learnRequest<{ data: { revision: number; workspace: LearnWorkspace } }>('learn/workspace')
export const saveWorkspace = (
  workspace: LearnWorkspace,
  revision: number,
  key: string,
  csrf: string,
) =>
  learnRequest<{ value: { revision: number } }>('learn/workspace', {
    method: 'PUT',
    body: JSON.stringify(workspace),
    headers: {
      'If-Match': String(revision),
      'Idempotency-Key': key,
      'X-CSRF-Token': csrf,
    },
  })
