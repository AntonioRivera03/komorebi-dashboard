import { Button } from '../../../shared/ui/Button'
import { Popover } from '../../../shared/ui/Popover'
import { MenuItem } from '../../../shared/ui/MenuItem'
import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ErrorLogEntry } from '../interfaces/types'
import styles from '../exams.module.css'

type Props = { entry: ErrorLogEntry; topicName: string; onRepair: (entry: ErrorLogEntry, kind: 'task' | 'prompt' | 'activity') => void }

/** A mistake becomes an explicitly accepted repair; then test again with a fresh attempt. */
export function ErrorLogEntryCard({ entry, topicName, onRepair }: Props) {
  return (
    <div className={styles.error}>
      <div className="k-row k-row--between">
        <StatusPill tone="soft">{topicName}</StatusPill>
        {entry.repair ? <StatusPill tone={entry.repair.retested ? 'ok' : 'warn'}>{entry.repair.retested ? 'retested' : `repair · ${entry.repair.kind}`}</StatusPill> : <StatusPill tone="danger">unrepaired</StatusPill>}
      </div>
      <q>{entry.question}</q>
      <span>{entry.mistake}</span>
      {entry.repair ? (
        <span className="muted small">
          {entry.repair.label} · <span className="mono">{entry.repair.ref}</span>
        </span>
      ) : (
        <Popover title="Turn into a repair" trigger={(props) => <Button size="sm" icon="chevron-down" {...props}>Repair</Button>}>
          {(close) => (
            <>
              <MenuItem icon="check" description="Tasks.createTask with an accepted draft" onClick={() => { onRepair(entry, 'task'); close() }}>A task</MenuItem>
              <MenuItem icon="edit" description="A new Study prompt draft for approval" onClick={() => { onRepair(entry, 'prompt'); close() }}>A prompt draft</MenuItem>
              <MenuItem icon="play" description="A short explanation session" onClick={() => { onRepair(entry, 'activity'); close() }}>A repair activity</MenuItem>
            </>
          )}
        </Popover>
      )}
    </div>
  )
}
