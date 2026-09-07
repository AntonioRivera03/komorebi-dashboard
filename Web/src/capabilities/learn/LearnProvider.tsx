import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Dialog } from '../../shared/ui/Dialog'
import { Button } from '../../shared/ui/Button'
import { LearnContext } from './useLearn'
import { completeFocus, stopFocus } from './model'

import { useLearnStorage } from './useLearnStorage'
import { finishFocusSound, startFocusAlarm, stopFocusAlarm, unlockFocusAudio } from './focusSound'

export function LearnProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { state, update: setState, storageError, connection } = useLearnStorage()
  useEffect(() => {
    if (!state.focusSoundEnabled) {
      stopFocusAlarm()
      return
    }
    let active = true
    if (state.focus.completedAt !== null) startFocusAlarm()
    // Recover a persisted alarm after the browser permits audio on user interaction.
    const unlock = () => {
      void unlockFocusAudio().then((ready) => {
        if (active && ready && state.focus.completedAt !== null) startFocusAlarm()
      })
    }
    document.addEventListener('pointerdown', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      active = false
      stopFocusAlarm()
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [state.focus.completedAt, state.focusSoundEnabled])
  useEffect(() => {
    const tick = () => setState((current) => completeFocus(current, Date.now()))
    const timer = window.setInterval(tick, 500)
    return () => window.clearInterval(timer)
  }, [setState])
  return (
    <LearnContext.Provider value={{ state, update: setState, storageError, connection }}>
      {children}
      <Dialog
        open={connection.phase === 'connecting'}
        title="Connecting learning"
        onClose={() => {}}
      >
        <p role="status">Loading your learning workspace…</p>
      </Dialog>
      {state.focus.completedAt !== null && pathname !== '/learn' && (
        <div
          role="status"
          className="k-row"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            padding: 16,
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            boxShadow: 'var(--shadow)',
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          <Link to="/learn">Pomodoro finished</Link>
          <Button
            variant="primary"
            onClick={() => {
              finishFocusSound(state.focusSoundEnabled)
              setState((s) => stopFocus(s, Date.now()))
            }}
          >
            Finish
          </Button>
        </div>
      )}
    </LearnContext.Provider>
  )
}
