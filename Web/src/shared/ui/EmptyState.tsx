import type { ReactNode } from 'react'

type Props = {
  glyph?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ glyph = '◌', title, children, action }: Props) {
  return (
    <div className="k-empty">
      <span className="k-empty__glyph" aria-hidden="true">
        {glyph}
      </span>
      <h4>{title}</h4>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  )
}
