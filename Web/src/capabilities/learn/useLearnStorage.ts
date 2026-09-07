import { useCallback, useEffect, useRef, useState } from 'react'
import {
  emptyLearnState,
  initialLearnState,
  restoreFocusSettings,
  uid,
  type LearnState,
} from './model'
import {
  getLearnSession,
  LearnApiError,
  learnRequest,
  loadWorkspace,
  loginLearn,
  saveWorkspace,
  workspaceOf,
  type LearnSession,
  type LearnWorkspace,
} from './learnApi'

const KEY = 'komorebi.learn.v1'
function localState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (
      parsed?.focus &&
      ['sessions', 'artifacts', 'decks', 'cards', 'reviews', 'materials', 'focusLog'].every((k) =>
        Array.isArray(parsed[k]),
      )
    )
      return restoreFocusSettings(parsed)
  } catch {
    /* A malformed preview must not prevent opening Learn. */
  }
  return initialLearnState()
}
export type LearnConnection = {
  mode: 'local' | 'server'
  phase: 'idle' | 'connecting' | 'saving' | 'saved' | 'error'
  message: string
  displayName: string
  dirty: boolean
  conflict: boolean
  connect: (ticket?: string) => Promise<void>
  retry: () => void
  reload: () => Promise<void>
  disconnect: () => Promise<void>
  importLocal: () => void
  exportCopy: () => void
}
export function useLearnStorage() {
  const [state, setState] = useState<LearnState>(localState)
  const current = useRef(state)
  const [storageError, setStorageError] = useState(false)
  const [info, setInfo] = useState({
    mode: 'local' as 'local' | 'server',
    phase: 'idle' as LearnConnection['phase'],
    message: '',
    displayName: '',
    dirty: false,
    conflict: false,
  })
  const auth = useRef<LearnSession | null>(null)
  const revision = useRef(0)
  const saved = useRef('')
  const busy = useRef(false)
  const connecting = useRef(false)
  const failed = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{
    workspace: LearnWorkspace
    revision: number
    key: string
  } | null>(null)
  const flush = useRef<() => Promise<void>>(async () => {})

  const apply = useCallback((next: LearnState) => {
    current.current = next
    setState(next)
  }, [])
  const persistLocal = useCallback((next: LearnState) => {
    try {
      if (!auth.current) localStorage.setItem(KEY, JSON.stringify(next))
      else
        localStorage.setItem(
          `komorebi.learn.focus.${auth.current.actorId}`,
          JSON.stringify({
            focus: next.focus,
            focusSoundEnabled: next.focusSoundEnabled,
          }),
        )
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [])
  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void flush.current()
    }, 400)
  }, [])
  const update = useCallback(
    (edit: (s: LearnState) => LearnState) => {
      if (connecting.current) return
      const next = edit(current.current)
      if (next === current.current) return
      apply(next)
      persistLocal(next)
      if (auth.current) {
        const dirty = !!pending.current || JSON.stringify(workspaceOf(next)) !== saved.current
        if (!dirty) failed.current = false
        setInfo((i) => ({
          ...i,
          dirty,
          phase: dirty ? (failed.current ? 'error' : 'saving') : 'saved',
          message: dirty ? i.message : '',
          conflict: dirty && i.conflict,
        }))
        if (dirty && !failed.current) scheduleSave()
      }
    },
    [apply, persistLocal, scheduleSave],
  )

  useEffect(() => {
    flush.current = async () => {
      if (busy.current || !auth.current || failed.current || connecting.current) return
      const workspace = workspaceOf(current.current)
      if (!pending.current && JSON.stringify(workspace) === saved.current) return
      const session = auth.current
      const job = pending.current ?? {
        workspace,
        revision: revision.current,
        key: uid(),
      }
      pending.current = job
      busy.current = true
      setInfo((i) => ({ ...i, phase: 'saving' }))
      try {
        const result = await saveWorkspace(job.workspace, job.revision, job.key, session.csrfToken)
        revision.current = result.value.revision
        saved.current = JSON.stringify(job.workspace)
        pending.current = null
        const dirty = JSON.stringify(workspaceOf(current.current)) !== saved.current
        setInfo((i) => ({
          ...i,
          phase: dirty ? 'saving' : 'saved',
          dirty,
          message: '',
          conflict: false,
        }))
        if (dirty) scheduleSave()
      } catch (err) {
        failed.current = true
        if (err instanceof LearnApiError && err.status === 422) pending.current = null
        setInfo((i) => ({
          ...i,
          phase: 'error',
          dirty: true,
          conflict: err instanceof LearnApiError && err.status === 409,
          message:
            err instanceof Error ? err.message : 'Could not save learning. Your edits remain open.',
        }))
      } finally {
        busy.current = false
      }
    }
  }, [scheduleSave])

  const connect = useCallback(
    async (ticket?: string) => {
      if (busy.current || connecting.current) return
      connecting.current = true
      setInfo((i) => ({ ...i, phase: 'connecting', message: '' }))
      try {
        const session = ticket ? await loginLearn(ticket.trim()) : await getLearnSession()
        if (session.principal !== 'user')
          throw new Error('Sign in with an owner ticket to open private learning.')
        if (ticket && auth.current) {
          if (session.actorId !== auth.current.actorId)
            throw new Error('Use a ticket for the same owner to recover these unsaved edits.')
          auth.current = session
          failed.current = false
          const dirty =
            !!pending.current || JSON.stringify(workspaceOf(current.current)) !== saved.current
          setInfo((i) => ({
            ...i,
            phase: dirty ? 'saving' : 'saved',
            message: '',
            dirty,
          }))
          if (dirty) scheduleSave()
          return
        }
        const { data } = await loadWorkspace()
        const next = { ...emptyLearnState(), ...data.workspace }
        try {
          const focus = JSON.parse(
            localStorage.getItem(`komorebi.learn.focus.${session.actorId}`) ?? 'null',
          )
          if (focus?.focus) Object.assign(next, focus)
        } catch {
          /* Use a fresh timer if its local settings cannot be restored. */
        }
        auth.current = session
        revision.current = data.revision
        saved.current = JSON.stringify(workspaceOf(next))
        failed.current = false
        pending.current = null
        apply(next)
        try {
          localStorage.setItem('komorebi.learn.connected', 'true')
        } catch {
          /* Session cookies still work. */
        }
        setInfo({
          mode: 'server',
          phase: 'saved',
          message: '',
          displayName: session.displayName,
          dirty: false,
          conflict: false,
        })
      } catch (err) {
        setInfo((i) => ({
          ...i,
          phase: 'error',
          message: err instanceof Error ? err.message : 'Could not connect to learning.',
        }))
      } finally {
        connecting.current = false
      }
    },
    [apply, scheduleSave],
  )

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      try {
        if (active && localStorage.getItem('komorebi.learn.connected') === 'true') void connect()
      } catch {
        /* Local preview remains usable. */
      }
    })
    return () => {
      active = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [connect])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (
        auth.current &&
        (pending.current || JSON.stringify(workspaceOf(current.current)) !== saved.current)
      ) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const exportCopy = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(current.current, null, 2)], {
        type: 'application/json',
      }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'komorebi-learning.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const connection: LearnConnection = {
    ...info,
    connect,
    exportCopy,
    retry: () => {
      failed.current = false
      void flush.current()
    },
    reload: async () => {
      if (busy.current || connecting.current) return
      if (
        info.dirty &&
        !window.confirm(
          'Reload the server copy and discard unsaved edits in this tab? Export a copy first if you want to keep them.',
        )
      )
        return
      await connect()
    },
    disconnect: async () => {
      if (busy.current || connecting.current || info.dirty) return
      connecting.current = true
      setInfo((i) => ({ ...i, phase: 'connecting' }))
      try {
        await learnRequest('core/session', {
          method: 'DELETE',
          headers: { 'X-CSRF-Token': auth.current!.csrfToken },
        })
        auth.current = null
        try {
          localStorage.removeItem('komorebi.learn.connected')
        } catch {
          /* No cached private workspace. */
        }
        apply(localState())
        setInfo({
          mode: 'local',
          phase: 'idle',
          message: '',
          displayName: '',
          dirty: false,
          conflict: false,
        })
      } catch (err) {
        setInfo((i) => ({
          ...i,
          message: (err as Error).message,
          phase: 'error',
        }))
      } finally {
        connecting.current = false
      }
    },
    importLocal: () => {
      if (!auth.current || current.current.sessions.length || info.dirty) return
      const local = localState()
      update((s) => ({ ...s, ...workspaceOf(local) }))
    },
  }
  return { state, update, storageError, connection }
}
