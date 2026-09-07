import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { useToast } from '../../../shared/ui/useToast'
import { useHabits } from '../interfaces/useHabits'
import { checkIn, createHabit, pauseHabit } from '../interfaces/habitsApi'
import { HabitCard } from '../components/HabitCard'
import { NewHabitDialog } from '../components/NewHabitDialog'

export default function HabitsPage() {
  const habits = useHabits()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Habits · M02 · undecided"
        title="Flexible routines"
        subtitle="A cue, an ordinary version and a smaller version. Check in as done, fallback, skipped or resting. Pause without losing history."
        actions={
          <>
            <StatusPill tone="warn">undecided</StatusPill>
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              New habit
            </Button>
          </>
        }
      />
      <AsyncPanel query={habits} skeletonLines={8}>
        {({ data }) => (
          <div className="k-grid k-grid--cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {data.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckIn={async (item, kind) => {
                  const result = await checkIn(item.id, kind)
                  if (result.status === 'completed') {
                    habits.mutate((current) => current.map((entry) => (entry.id === item.id ? result.value : entry)))
                    toast(kind === 'resting' ? 'Rest recorded · not a failed streak' : `Checked in · ${kind}`)
                  }
                }}
                onPause={async (item, paused) => {
                  const result = await pauseHabit(item.id, paused)
                  if (result.status === 'completed') habits.mutate((current) => current.map((entry) => (entry.id === item.id ? result.value : entry)))
                }}
              />
            ))}
          </div>
        )}
      </AsyncPanel>
      <NewHabitDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={async (cue, action, fallback, cadence) => {
          const result = await createHabit(cue, action, fallback, cadence)
          if (result.status === 'completed') {
            habits.mutate((current) => [...current, result.value])
            setCreating(false)
          }
        }}
      />
    </div>
  )
}
