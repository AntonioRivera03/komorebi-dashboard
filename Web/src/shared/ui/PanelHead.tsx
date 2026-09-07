import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  eyebrow?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}

export function PanelHead({ title, eyebrow, meta, actions }: Props) {
  return (
    <header className="k-panel-head">
      <div className="k-panel-head__stack">
        {eyebrow ? <span className="label">{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      <div className="k-panel-head__meta">
        {meta}
        {actions}
      </div>
    </header>
  )
}
