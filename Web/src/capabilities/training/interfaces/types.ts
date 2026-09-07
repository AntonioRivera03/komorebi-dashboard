export type PlannedWorkout = { id: string; date: string; title: string; targetKm?: number; targetMinutes?: number; effort: 'easy' | 'steady' | 'hard'; status: 'planned' | 'done' | 'missed' | 'moved'; log?: WorkoutLog }
export type WorkoutLog = { id: string; at: string; km: number; minutes: number; effort?: number; notes?: string; source: 'manual' | 'import' }
export type TrainingPlan = { id: string; name: string; target: string; targetDate: string; weeks: number; baseline?: { km: number; minutes: number; at: string }; workouts: PlannedWorkout[] }
