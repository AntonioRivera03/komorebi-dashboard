import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextInput } from '../../../shared/ui/TextInput'
import { newId } from '../../../shared/api/mock'
import styles from '../household.module.css'

type Props = { onAdd: (name: string, quantity: string, key: string) => Promise<void> }

export function ShoppingAddRow({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [key, setKey] = useState(() => newId('idem'))
  const [busy, setBusy] = useState(false)
  return (
    <form
      className={styles.addRow}
      onSubmit={async (event) => {
        event.preventDefault()
        if (!name.trim()) return
        setBusy(true)
        await onAdd(name, quantity, key)
        setBusy(false)
        setName('')
        setQuantity('')
        setKey(newId('idem'))
      }}
    >
      <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Add an item" aria-label="Item name" />
      <TextInput value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="qty" aria-label="Quantity" />
      <Button type="submit" busy={busy} disabled={!name.trim()} icon="plus">
        Add
      </Button>
    </form>
  )
}
