import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog } from '../../../shared/ui/Dialog'
import { Button } from '../../../shared/ui/Button'
import { Kbd } from '../../../shared/ui/Kbd'
import { useToast } from '../../../shared/ui/useToast'
import { useOperation } from '../../../shared/hooks/useOperation'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import { newId } from '../../../shared/api/mock'
import { routes } from '../../../shared/lib/routes'
import { useShellOverlay } from '../../../app/providers/useShellOverlay'
import { captureItem } from '../interfaces/captureApi'
import styles from '../capture.module.css'

/** Shell-level quick capture (P01). Press C anywhere. Nothing needs a category or deadline. */
export function QuickCaptureDialog() {
  const { overlay, close } = useShellOverlay()
  const navigate = useNavigate()
  const toast = useToast()
  const [body, setBody] = useState('')
  const [key, setKey] = useState(() => newId('idem'))
  const capture = useOperation(captureItem)

  const submit = async () => {
    const result = await capture.run(body, 'typed', key)
    if (result.status === 'completed') {
      setBody('')
      setKey(newId('idem'))
      capture.reset()
      close()
      toast('Captured. Decide where it belongs later.', { action: { label: 'Open inbox', onClick: () => navigate(routes.capture) } })
    }
  }

  return (
    <Dialog
      open={overlay === 'capture'}
      onClose={close}
      title="Put it somewhere safe"
      eyebrow="Quick capture"
      footer={
        <>
          <span className="muted small" style={{ marginRight: 'auto' }}>
            <Kbd>⌘↵</Kbd> capture
          </span>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} busy={capture.busy} disabled={!body.trim()}>
            Capture
          </Button>
        </>
      }
    >
      <div className={`k-form ${styles.quick}`}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="A task, a thought, a link, a question…"
          aria-label="Capture"
          autoFocus
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit()
          }}
        />
        <OperationBanner state={capture.state} onRetry={submit} />
      </div>
    </Dialog>
  )
}
