import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useClickOutside } from '../hooks/useClickOutside'

type Props = {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-controls': string }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  direction?: 'down' | 'up'
  title?: string
  width?: number
}

/** Small anchored popover for menus, explanations and quick choices. */
export function Popover({ trigger, children, align = 'left', direction = 'down', title, width }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, open, close)

  return (
    <div className="k-popover-anchor" ref={ref}>
      {trigger({ onClick: () => setOpen((value) => !value), 'aria-expanded': open, 'aria-controls': id })}
      {open ? (
        <div
          id={id}
          role="dialog"
          className={cn('k-popover', align === 'right' && 'k-popover--right', direction === 'up' && 'k-popover--up')}
          style={width ? { width } : undefined}
        >
          {title ? <div className="k-popover__title label">{title}</div> : null}
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </div>
  )
}
