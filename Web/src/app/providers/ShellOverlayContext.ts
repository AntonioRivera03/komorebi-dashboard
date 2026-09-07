import { createContext } from 'react'

export type ShellOverlay = 'palette' | 'capture' | 'voice' | 'assistant' | null
export type ShellOverlayApi = {
  overlay: ShellOverlay
  open: (overlay: Exclude<ShellOverlay, null>) => void
  close: () => void
  toggle: (overlay: Exclude<ShellOverlay, null>) => void
}
export const ShellOverlayContext = createContext<ShellOverlayApi | null>(null)
