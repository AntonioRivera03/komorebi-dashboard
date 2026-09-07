import { cn } from '../lib/cn'
import type { ToastItem } from './ToastContext'

type Props = { items: ToastItem[]; onDismiss: (id: number) => void }

export function ToastViewport({ items, onDismiss }: Props) {
  return (
    <div className="k-toasts" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={cn('k-toast', item.tone !== 'neutral' && `k-toast--${item.tone}`)}>
          <span>{item.message}</span>
          {item.action ? (
            <button
              type="button"
              onClick={() => {
                item.action?.onClick()
                onDismiss(item.id)
              }}
            >
              {item.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
