import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { TrainingPlan, WorkoutLog } from './types'

let plan: TrainingPlan = {
  id: 'plan_10k',
  name: 'Conversational 10K',
  target: '10 km at conversational pace',
  targetDate: daysFromNow(80),
  weeks: 12,
  baseline: { km: 5, minutes: 33, at: minutesAgo(20000) },
  workouts: [
    { id: 'w1', date: daysFromNow(-2, 8), title: 'Easy run', targetKm: 4, effort: 'easy', status: 'done', log: { id: 'l1', at: daysFromNow(-2, 8), km: 4.1, minutes: 27, effort: 3, notes: 'Legs heavy after seminar day', source: 'manual' } },
    { id: 'w2', date: daysFromNow(0, 18), title: 'Steady 5K', targetKm: 5, effort: 'steady', status: 'planned' },
    { id: 'w3', date: daysFromNow(1, 8), title: 'Easy run 5 km', targetKm: 5, effort: 'easy', status: 'planned' },
    { id: 'w4', date: daysFromNow(3, 9), title: 'Long run', targetKm: 7, effort: 'easy', status: 'planned' },
    { id: 'w5', date: daysFromNow(-5, 8), title: 'Intervals 6×400', targetMinutes: 30, effort: 'hard', status: 'missed' },
  ],
}

export async function getTrainingSummary(): Promise<Snapshot<TrainingPlan>> {
  await wait()
  return snapshot(plan)
}

export async function recordWorkout(workoutId: string, log: Omit<WorkoutLog, 'id' | 'at' | 'source'>): Promise<Operation<TrainingPlan>> {
  await wait(260)
  const workout = plan.workouts.find((item) => item.id === workoutId)
  if (!workout) return failedOperation('not_found', false)
  workout.status = 'done'
  workout.log = { id: newId('log'), at: nowIso(), source: 'manual', ...log }
  plan = { ...plan }
  return completed(plan)
}

export async function reviseFuturePlan(workoutId: string, newDate: string): Promise<Operation<TrainingPlan>> {
  await wait(220)
  const workout = plan.workouts.find((item) => item.id === workoutId)
  if (!workout) return failedOperation('not_found', false)
  workout.date = newDate
  workout.status = 'moved'
  plan = { ...plan }
  return completed(plan)
}
