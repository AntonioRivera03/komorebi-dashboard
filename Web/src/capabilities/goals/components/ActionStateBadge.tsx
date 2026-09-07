import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ActionState } from '../interfaces/types'

const copy: Record<ActionState, { label: string; tone: 'neutral' | 'ok' | 'warn' | 'soft' }> = {
  no_next_action: { label: 'no next action selected', tone: 'warn' },
  next_action_selected: { label: 'next action selected', tone: 'ok' },
  waiting: { label: 'waiting', tone: 'neutral' },
  paused: { label: 'paused', tone: 'neutral' },
  completed: { label: 'completed', tone: 'soft' },
}

/** Goals must show action state explicitly; exploration can stay undated without being "behind". */
export function ActionStateBadge({ state }: { state: ActionState }) {
  return <StatusPill tone={copy[state].tone}>{copy[state].label}</StatusPill>
}
