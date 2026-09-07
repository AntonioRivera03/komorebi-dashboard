import { Dialog } from '../../../shared/ui/Dialog'
import { useShellOverlay } from '../../../app/providers/useShellOverlay'
import { useVoiceCapability } from '../interfaces/useVoiceCapability'
import { PushToTalkStage } from './PushToTalkStage'

/** Shell-level push-to-talk control (I04). Available from any page with V. */
export function PushToTalkDialog() {
  const { overlay, close } = useShellOverlay()
  const capability = useVoiceCapability()
  const open = overlay === 'voice'
  return (
    <Dialog open={open} onClose={close} title="Say it once" eyebrow="Voice · push to talk">
      {open ? <PushToTalkStage capability={capability} onDone={close} /> : null}
    </Dialog>
  )
}
