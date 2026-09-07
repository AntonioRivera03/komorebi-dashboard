import { Link } from 'react-router'
import type { ResourceRef } from '../contracts/common'
import { cn } from '../lib/cn'
import { Icon } from './Icon'

type Props = { resource: ResourceRef; to?: string; label?: string; broken?: boolean }

/** Displays a typed cross-capability reference; broken references stay visible, not hidden. */
export function ResourceChip({ resource, to, label, broken }: Props) {
  const body = (
    <>
      <span className="k-ref__owner">{resource.owner}</span>
      <span>·</span>
      <span>{label ?? `${resource.kind} ${resource.id}`}</span>
      {resource.revision !== undefined ? <span className="muted">r{resource.revision}</span> : null}
      {to && !broken ? <Icon name="arrow-right" size={10} /> : null}
    </>
  )
  if (to && !broken) {
    return (
      <Link to={to} className="k-ref">
        {body}
      </Link>
    )
  }
  return <span className={cn('k-ref', broken && 'k-ref--broken')} title={broken ? 'Reference unavailable' : undefined}>{body}</span>
}
