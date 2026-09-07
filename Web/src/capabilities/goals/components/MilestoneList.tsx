import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { TextInput } from '../../../shared/ui/TextInput'
import { formatMonthDay } from '../../../shared/lib/format'
import type { Milestone } from '../interfaces/types'
import styles from '../goals.module.css'

type Props = { milestones: Milestone[]; onToggle: (id: string) => void; onAdd: (title: string) => void }

export function MilestoneList({ milestones, onToggle, onAdd }: Props) {
  const [title, setTitle] = useState('')
  return (
    <div>
      <ol className={styles.milestones}>
        {milestones.map((milestone) => (
          <li key={milestone.id} className={styles.milestone} data-done={milestone.done}>
            <span>{milestone.title}</span>
            <div className="k-row">
              {milestone.targetDate ? <span className="muted small mono">{formatMonthDay(milestone.targetDate)}</span> : null}
              <Checkbox round checked={milestone.done} onChange={() => onToggle(milestone.id)} aria-label={`Mark ${milestone.title}`} />
            </div>
          </li>
        ))}
      </ol>
      <form
        className="k-row"
        style={{ marginTop: 12 }}
        onSubmit={(event) => {
          event.preventDefault()
          if (title.trim()) {
            onAdd(title.trim())
            setTitle('')
          }
        }}
      >
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add an ordered milestone" style={{ flex: 1 }} aria-label="New milestone" />
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add
        </Button>
      </form>
    </div>
  )
}
