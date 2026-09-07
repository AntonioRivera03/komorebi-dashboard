import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ShellOverlayContext, type ShellOverlay } from './ShellOverlayContext'

/** Which shell-level overlay is open; only one at a time. */
export function ShellOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<ShellOverlay>(null)
  const open = useCallback((next: Exclude<ShellOverlay, null>) => setOverlay(next), [])
  const close = useCallback(() => setOverlay(null), [])
  const toggle = useCallback((next: Exclude<ShellOverlay, null>) => setOverlay((current) => (current === next ? null : next)), [])
  const api = useMemo(() => ({ overlay, open, close, toggle }), [overlay, open, close, toggle])
  return <ShellOverlayContext.Provider value={api}>{children}</ShellOverlayContext.Provider>
}
