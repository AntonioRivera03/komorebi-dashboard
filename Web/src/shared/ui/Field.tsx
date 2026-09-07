import type { ReactNode } from 'react'

type Props = {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, children }: Props) {
  return (
    <div className="k-field">
      <div className="k-field__label">
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
        {hint ? <span className="k-field__hint">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="k-field__error">{error}</span> : null}
    </div>
  )
}
