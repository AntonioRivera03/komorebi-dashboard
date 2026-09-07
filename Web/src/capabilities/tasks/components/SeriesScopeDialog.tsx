import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import type { SeriesEditScope } from '../interfaces/types'

type Props = { open: boolean; verb: string; onChoose: (scope: SeriesEditScope) => void; onClose: () => void }

/** Editing a recurring task never touches the series without an explicit choice. */
export function SeriesScopeDialog({ open, verb, onChoose, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={`${verb} one occurrence or the series?`} eyebrow="Recurring task">
      <p className="muted" style={{ fontSize: 12, marginBottom: 18 }}>
        Changing only this occurrence leaves later occurrences intact. Changing the series affects future occurrences; past completions are never rewritten.
      </p>
      <div className="k-stack">
        <Button block onClick={() => onChoose('occurrence')}>
          Only this occurrence
        </Button>
        <Button block variant="soft" onClick={() => onChoose('series')}>
          This and future occurrences
        </Button>
      </div>
    </Dialog>
  )
}
