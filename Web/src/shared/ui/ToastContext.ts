import { createContext } from 'react'

export type ToastTone = 'neutral' | 'warn' | 'danger'
export type ToastItem = { id: number; message: string; tone: ToastTone; action?: { label: string; onClick: () => void } }
export type ToastApi = { toast: (message: string, options?: { tone?: ToastTone; action?: ToastItem['action']; durationMs?: number }) => void }
export const ToastContext = createContext<ToastApi | null>(null)
