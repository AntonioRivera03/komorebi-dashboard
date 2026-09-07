import { Button } from '../../../shared/ui/Button'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ExperienceIdea } from '../interfaces/types'
import styles from '../relationships.module.css'

type Props = { idea: ExperienceIdea; onRequestTask: (idea: ExperienceIdea) => void }

export function ExperienceIdeaRow({ idea, onRequestTask }: Props) {
  return (
    <div className={styles.idea}>
      <div>
        {idea.title}
        <small>
          {idea.withWhom ? `with ${idea.withWhom}` : 'solo'}
          {idea.season ? ` · ${idea.season}` : ''}
        </small>
      </div>
      {idea.requested ? (
        <StatusPill tone="ok">
          {idea.requested.kind} · {idea.requested.ref}
        </StatusPill>
      ) : (
        <Button size="sm" onClick={() => onRequestTask(idea)}>
          Make it a task
        </Button>
      )}
    </div>
  )
}
