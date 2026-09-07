import { useContext } from 'react'
import { ShellOverlayContext } from './ShellOverlayContext'

export function useShellOverlay() {
  const api = useContext(ShellOverlayContext)
  if (!api) throw new Error('useShellOverlay must be used within ShellOverlayProvider')
  return api
}
