import { Fragment } from 'react'
import { cn } from '../lib/cn'

export type TrailStep = { id: string; label: string }

type Props = {
  steps: TrailStep[]
  current: string
  /** A terminal exception such as failed / partial / unknown_outcome. */
  exception?: { label: string; tone: 'failed' | 'warn' }
}

/** Visualises an operation lifecycle such as queued → sent → acknowledged → confirmed. */
export function LifecycleTrail({ steps, current, exception }: Props) {
  const currentIndex = steps.findIndex((step) => step.id === current)
  return (
    <div className="k-trail" aria-label={`Lifecycle: ${exception ? exception.label : current}`}>
      {steps.map((step, index) => {
        const done = currentIndex > index || (currentIndex === index && index === steps.length - 1 && !exception)
        const isCurrent = currentIndex === index && !done && !exception
        return (
          <Fragment key={step.id}>
            {index > 0 ? <span className="k-trail__link" aria-hidden="true" /> : null}
            <span className={cn('k-trail__step', done && 'k-trail__step--done', isCurrent && 'k-trail__step--current')}>{step.label}</span>
          </Fragment>
        )
      })}
      {exception ? (
        <>
          <span className="k-trail__link" aria-hidden="true" />
          <span className={cn('k-trail__step', exception.tone === 'failed' ? 'k-trail__step--failed' : 'k-trail__step--warn')}>{exception.label}</span>
        </>
      ) : null}
    </div>
  )
}
