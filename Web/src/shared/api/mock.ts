import type { Freshness, Operation, Snapshot } from '../contracts/common'

/*
 * Mock transport helpers. Capability `interfaces/` modules use these to imitate
 * the FastAPI adapters until the generated client exists. Latency is simulated
 * so loading and pending states are exercised honestly.
 */
export const wait = (ms = 220) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function snapshot<T>(data: T, freshness: Freshness = 'current', observedAt = new Date()): Snapshot<T> {
  return { data, observedAt: observedAt.toISOString(), freshness }
}

export function completed<T>(value: T): Operation<T> {
  return { status: 'completed', value }
}

export function pendingOperation(operationId: string, pollUrl = `/api/v1/operations/${operationId}`): Operation<never> {
  return { status: 'pending', operationId, pollUrl }
}

export function failedOperation(code: string, retryable = true, message?: string): Operation<never> {
  return { status: 'failed', code, retryable, message }
}

let counter = 0
export function newId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36).slice(-4)}${counter.toString(36)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString()
}

export function daysFromNow(days: number, hour = 9, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

/** Deterministic pseudo-random helper so mock data stays stable across renders. */
export function seeded(seed: number): () => number {
  let value = seed % 2147483647
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}
