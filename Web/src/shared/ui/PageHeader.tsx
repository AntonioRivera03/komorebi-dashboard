import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

type Props = {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
}

export function PageHeader({ eyebrow, title, subtitle, actions, back }: Props) {
  return (
    <header className="k-page-head">
      <div className="k-page-head__copy">
        {back ? (
          <Link to={back.to} className="k-back">
            <Icon name="chevron-left" size={11} /> {back.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            {eyebrow}
          </p>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p className="k-page-head__sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="k-page-head__actions">{actions}</div> : null}
    </header>
  )
}
