import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { IconButton } from './IconButton'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  wide?: boolean
  dismissible?: boolean
  children: ReactNode
  footer?: ReactNode
  footerAlign?: 'end' | 'between'
}

/** Modal built on the native <dialog> element for focus trapping and Escape handling. */
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  wide,
  dismissible = true,
  children,
  footer,
  footerAlign = 'end',
}: Props) {
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
      if (dismissible) onClose()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [onClose, dismissible])

  return (
    <dialog
      ref={ref}
      className="k-dialog"
      onClick={(event) => {
        if (dismissible && event.target === ref.current) onClose()
      }}
    >
      {open ? (
        <div className={cn('k-dialog__box', wide && 'k-dialog__box--wide')} role="document">
          <div className="k-dialog__head">
            <div className="k-panel-head__stack">
              {eyebrow ? <span className="label">{eyebrow}</span> : null}
              <h2>{title}</h2>
            </div>
            {dismissible && <IconButton icon="close" label="Close" onClick={onClose} size="sm" />}
          </div>
          {children}
          {footer ? (
            <div
              className={cn(
                'k-dialog__foot',
                footerAlign === 'between' && 'k-dialog__foot--between',
              )}
            >
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}
