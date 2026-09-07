export type CheckinKind = 'completed' | 'fallback' | 'skipped' | 'resting'
export type Habit = { id: string; cue: string; action: string; fallback?: string; cadence: string; paused: boolean; checkins: { periodKey: string; kind: CheckinKind; at: string }[]; taskSeriesRef?: string; reminder?: { channel: string; quietHours: boolean } }
