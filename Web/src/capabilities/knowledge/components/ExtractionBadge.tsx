import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ExtractionState } from '../interfaces/types'

const tone: Record<ExtractionState, 'neutral' | 'warn' | 'ok' | 'danger'> = { queued: 'neutral', extracting: 'warn', ready: 'ok', partial: 'warn', failed: 'danger' }

export function ExtractionBadge({ state }: { state: ExtractionState }) {
  return (
    <StatusPill tone={tone[state]} live={state === 'extracting' || state === 'queued'}>
      {state}
    </StatusPill>
  )
}
