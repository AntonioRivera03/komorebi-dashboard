import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { Select } from '../../../shared/ui/Select'
import type { TaskFilter } from '../interfaces/types'
import styles from '../tasks.module.css'

type Props = { filter: TaskFilter; contexts: string[]; onChange: (filter: TaskFilter) => void }

export function TaskFilters({ filter, contexts, onChange }: Props) {
  return (
    <div className={styles.filters}>
      <SegmentedControl
        label="Status"
        value={filter.status}
        onChange={(status) => onChange({ ...filter, status })}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'all', label: 'All' },
        ]}
      />
      <Select
        aria-label="Due"
        value={filter.due ?? 'any'}
        onChange={(event) => onChange({ ...filter, due: event.target.value as TaskFilter['due'] })}
        options={[
          { value: 'any', label: 'Any date' },
          { value: 'today', label: 'Due today' },
          { value: 'week', label: 'Next 7 days' },
          { value: 'overdue', label: 'Overdue' },
        ]}
      />
      <Select
        aria-label="Context"
        value={filter.context ?? ''}
        onChange={(event) => onChange({ ...filter, context: event.target.value || undefined })}
        options={[{ value: '', label: 'Every context' }, ...contexts.map((context) => ({ value: context, label: `#${context}` }))]}
      />
    </div>
  )
}
