import { useCallback, useEffect, useRef, useState } from 'react'

/** Display-only focus timer. Server deadlines remain authoritative for timed exams. */
export function useFocusTimer(initialSeconds = 25 * 60) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    ref.current = window.setInterval(() => setRemaining((value) => (value > 0 ? value - 1 : 0)), 1000)
    return () => {
      if (ref.current) window.clearInterval(ref.current)
    }
  }, [running])

  useEffect(() => {
    if (remaining === 0) setRunning(false)
  }, [remaining])

  const toggle = useCallback(() => setRunning((value) => !value), [])
  const reset = useCallback(() => {
    setRunning(false)
    setRemaining(initialSeconds)
  }, [initialSeconds])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return { display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, running, toggle, reset, remaining }
}
