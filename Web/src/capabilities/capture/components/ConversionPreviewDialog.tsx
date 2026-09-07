import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { useConversionPreview } from '../interfaces/useConversionPreview'
import type { DestinationKind } from '../interfaces/types'
import styles from '../capture.module.css'

type Props = { captureId: string | null; destination: DestinationKind | null; busy?: boolean; onConfirm: () => void; onClose: () => void }

/** Shows extracted title/content before conversion. The original capture is kept either way. */
export function ConversionPreviewDialog({ captureId, destination, busy, onConfirm, onClose }: Props) {
  const { preview, loading } = useConversionPreview(captureId, destination)
  return (
    <Dialog
      open={captureId !== null && destination !== null}
      onClose={onClose}
      eyebrow="Preview before converting"
      title={destination ? `Convert to ${destination}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Back
          </Button>
          <Button variant="primary" onClick={onConfirm} busy={busy} disabled={loading}>
            Create {destination}
          </Button>
        </>
      }
    >
      {loading || !preview ? (
        <Skeleton lines={4} />
      ) : (
        <div className={styles.previewBox}>
          <span className="label">{preview.destination} title</span>
          <h3>{preview.title}</h3>
          <span className="label">content</span>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{preview.content}</p>
          <ul>
            {preview.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  )
}
