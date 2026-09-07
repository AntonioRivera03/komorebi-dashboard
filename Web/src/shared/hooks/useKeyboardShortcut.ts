import { useEffect } from 'react'

type Options = {
  meta?: boolean
  shift?: boolean
  /** Fire even when focus is in an input/textarea. */
  allowInInputs?: boolean
}

export function useKeyboardShortcut(key: string, handler: (event: KeyboardEvent) => void, options: Options = {}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      const wantsMeta = options.meta ?? false
      const hasMeta = event.metaKey || event.ctrlKey
      if (wantsMeta !== hasMeta) return
      if ((options.shift ?? false) !== event.shiftKey) return
      const target = event.target as HTMLElement | null
      const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (inInput && !options.allowInInputs && !wantsMeta) return
      handler(event)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, handler, options.meta, options.shift, options.allowInInputs])
}
