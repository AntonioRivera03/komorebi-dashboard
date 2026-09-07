import { Button } from '../../../shared/ui/Button'
import { LifecycleTrail } from '../../../shared/ui/LifecycleTrail'
import { ResourceChip } from '../../../shared/ui/ResourceChip'
import type { ConversionOperation } from '../interfaces/types'

const steps = [
  { id: 'requested', label: 'requested' },
  { id: 'owner', label: 'owner command' },
  { id: 'completed', label: 'linked' },
]

type Props = { conversion: ConversionOperation; onRetry: () => void; busy?: boolean }

function routeFor(conversion: ConversionOperation): string | undefined {
  const ref = conversion.resultRef
  if (!ref) return undefined
  if (ref.owner === 'tasks') return `/tasks/${ref.id}`
  if (ref.kind === 'note') return `/learn/notes/${ref.id}`
  return `/learn/library/${ref.id}`
}

export function ConversionStatus({ conversion, onRetry, busy }: Props) {
  return (
    <div className="k-stack">
      <span className="label">Conversion {conversion.id}</span>
      <LifecycleTrail
        steps={steps}
        current={conversion.status === 'completed' ? 'completed' : 'owner'}
        exception={conversion.status === 'failed' ? { label: 'failed', tone: 'failed' } : undefined}
      />
      {conversion.status === 'completed' && conversion.resultRef ? <ResourceChip resource={conversion.resultRef} to={routeFor(conversion)} /> : null}
      {conversion.status === 'failed' ? (
        <div className="k-error" role="alert">
          <span>
            {conversion.error} <span className="mono">· attempt {conversion.attempts}</span>
          </span>
          <Button size="sm" icon="refresh" onClick={onRetry} busy={busy}>
            Retry with same key
          </Button>
        </div>
      ) : null}
    </div>
  )
}
