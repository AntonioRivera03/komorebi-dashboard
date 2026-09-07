import { useState } from 'react'
import { IconButton } from '../../../shared/ui/IconButton'
import styles from '../assistant.module.css'

type Props = { onSend: (text: string) => void; disabled?: boolean; suggestions?: string[]; autoFocus?: boolean }

export function ChatComposer({ onSend, disabled, suggestions, autoFocus }: Props) {
  const [text, setText] = useState('')
  const submit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }
  return (
    <div>
      {suggestions?.length ? (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="k-pill" onClick={() => onSend(suggestion)} disabled={disabled}>
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.composer}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask about your notes, attempts, goals or commitments… or ask me to draft a change."
          aria-label="Message"
          rows={1}
          autoFocus={autoFocus}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <IconButton icon="send" label="Send" onClick={submit} disabled={disabled || !text.trim()} active={Boolean(text.trim())} />
      </div>
    </div>
  )
}
