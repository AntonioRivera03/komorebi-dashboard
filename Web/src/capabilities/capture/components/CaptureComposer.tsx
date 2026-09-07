import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Kbd } from '../../../shared/ui/Kbd'
import { useOperation } from '../../../shared/hooks/useOperation'
import { newId } from '../../../shared/api/mock'
import { captureItem } from '../interfaces/captureApi'
import type { CaptureItem } from '../interfaces/types'
import { OperationBanner } from '../../../shared/ui/OperationBanner'
import styles from '../capture.module.css'

type Props = { onCaptured: (item: CaptureItem) => void }

function describeKind(body: string): string {
  if (/^https?:\/\//i.test(body.trim())) return 'url · will offer source import'
  if (/\.(pdf|md|txt|docx?)$/i.test(body.trim())) return 'file reference'
  if (!body.trim()) return 'text, a link or a file name'
  return `text · ${body.trim().split(/\s+/).length} words`
}

export function CaptureComposer({ onCaptured }: Props) {
  const [body, setBody] = useState('')
  const [key, setKey] = useState(() => newId('idem'))
  const capture = useOperation(captureItem)

  const submit = async () => {
    const result = await capture.run(body, 'typed', key)
    if (result.status === 'completed') {
      onCaptured(result.value)
      setBody('')
      setKey(newId('idem'))
      capture.reset()
    }
  }

  return (
    <div className={styles.composer}>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Put it here first. Decide where it belongs later."
        aria-label="Capture"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit()
        }}
      />
      <div className={styles.composerBar}>
        <span className={styles.kindHint}>{describeKind(body)}</span>
        <div className="k-row">
          <span className="muted small">
            <Kbd>⌘↵</Kbd> save
          </span>
          <Button variant="primary" onClick={submit} busy={capture.busy} disabled={!body.trim()}>
            Capture
          </Button>
        </div>
      </div>
      <OperationBanner state={capture.state} onRetry={submit} />
    </div>
  )
}
