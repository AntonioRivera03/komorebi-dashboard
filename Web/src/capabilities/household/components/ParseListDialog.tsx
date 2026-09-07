import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { TextArea } from '../../../shared/ui/TextArea'
import { Notice } from '../../../shared/ui/Notice'
import { parseShoppingText } from '../interfaces/householdApi'
import type { ShoppingParseDraft } from '../interfaces/types'
import styles from '../household.module.css'

type Props = { open: boolean; onClose: () => void; onAccept: (drafts: ShoppingParseDraft[]) => void }

/** Optional AI parsing of pasted text into previewable item/quantity drafts. */
export function ParseListDialog({ open, onClose, onAccept }: Props) {
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState<ShoppingParseDraft[] | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Household · AI parse"
      title="Paste a list"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {drafts ? (
            <Button variant="primary" onClick={() => onAccept(drafts)}>
              Add {drafts.length} items
            </Button>
          ) : (
            <Button
              variant="primary"
              icon="sparkle"
              busy={busy}
              disabled={!text.trim()}
              onClick={async () => {
                setBusy(true)
                setDrafts(await parseShoppingText(text))
                setBusy(false)
              }}
            >
              Preview items
            </Button>
          )}
        </>
      }
    >
      <div className="k-form">
        <TextArea value={text} onChange={(event) => setText(event.target.value)} placeholder={'2 oat milk\ncoffee filters\nrice 1kg'} rows={5} aria-label="List text" />
        {drafts ? (
          <div>
            {drafts.map((draft, index) => (
              <div key={index} className={styles.parsed}>
                <span>{draft.name}</span>
                <span className="mono muted">{draft.quantity}</span>
              </div>
            ))}
          </div>
        ) : null}
        <Notice glyph="✦">Preview before adding. Items are never merged just because names look similar; exact text entry is always available.</Notice>
      </div>
    </Dialog>
  )
}
