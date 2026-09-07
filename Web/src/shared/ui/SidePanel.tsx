import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { IconButton } from './IconButton'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  side?: 'right' | 'left'
  wide?: boolean
  children: ReactNode
  footer?: ReactNode
  headerExtra?: ReactNode
}

/** Slide-in drawer for detail and editing without leaving the page. */
export function SidePanel({ open, onClose, title, eyebrow, side = 'right', wide, children, footer, headerExtra }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      className={cn('k-drawer', side === 'left' && 'k-drawer--left')}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {open ? (
        <div className={cn('k-drawer__box', wide && 'k-drawer__box--wide')} role="document">
          <div className="k-drawer__head">
            <div className="k-panel-head__stack">
              {eyebrow ? <span className="label">{eyebrow}</span> : null}
              <h2>{title}</h2>
              {headerExtra}
            </div>
            <IconButton icon="close" label="Close panel" onClick={onClose} size="sm" />
          </div>
          <div className="k-drawer__body">{children}</div>
          {footer ? <div className="k-drawer__foot">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  )
}
