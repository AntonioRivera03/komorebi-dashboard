import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi, type ToastItem } from './ToastContext'
import { ToastViewport } from './ToastViewport'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), [])
  const toast = useCallback<ToastApi['toast']>(
    (message, options) => {
      const id = Date.now() + Math.random()
      setItems((current) => [...current.slice(-3), { id, message, tone: options?.tone ?? 'neutral', action: options?.action }])
      window.setTimeout(() => dismiss(id), options?.durationMs ?? 4200)
    },
    [dismiss],
  )
  const api = useMemo(() => ({ toast }), [toast])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
