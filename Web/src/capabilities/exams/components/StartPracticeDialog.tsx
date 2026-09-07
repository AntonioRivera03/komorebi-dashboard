import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { Switch } from '../../../shared/ui/Switch'
import { TextInput } from '../../../shared/ui/TextInput'
import { Notice } from '../../../shared/ui/Notice'

type Props = { open: boolean; busy?: boolean; onClose: () => void; onStart: (timed: boolean, duration?: number) => void }

export function StartPracticeDialog({ open, busy, onClose, onStart }: Props) {
  const [timed, setTimed] = useState(true)
  const [duration, setDuration] = useState(40)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Exams · practice run"
      title="Start a practice set"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} onClick={() => onStart(timed, timed ? duration : undefined)}>
            Start
          </Button>
        </>
      }
    >
      <div className="k-form">
        <div className="k-row k-row--between">
          <span style={{ fontSize: 13 }}>Timed</span>
          <Switch label="Timed" checked={timed} onChange={setTimed} />
        </div>
        {timed ? (
          <Field label="Duration" hint="minutes">
            <TextInput type="number" min={10} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </Field>
        ) : null}
        <Notice glyph="⏱">Server deadlines are authoritative; the browser timer is display only. Expiry preserves already submitted answers. The run pins a stable selection of prompt revisions.</Notice>
      </div>
    </Dialog>
  )
}
