import { useCallback } from 'react'
import { useKeyboardShortcut } from '../../shared/hooks/useKeyboardShortcut'
import { useShellOverlay } from '../providers/useShellOverlay'

/** Global keyboard shortcuts: ⌘K palette, C capture, V voice, A assistant. */
export function ShellShortcuts() {
  const { toggle } = useShellOverlay()
  useKeyboardShortcut('k', useCallback((event: KeyboardEvent) => { event.preventDefault(); toggle('palette') }, [toggle]), { meta: true, allowInInputs: true })
  useKeyboardShortcut('c', useCallback(() => toggle('capture'), [toggle]))
  useKeyboardShortcut('v', useCallback(() => toggle('voice'), [toggle]))
  useKeyboardShortcut('a', useCallback(() => toggle('assistant'), [toggle]))
  return null
}
