const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const longDayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
const monthDayFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

export function formatDay(iso: string): string {
  return dayFormatter.format(new Date(iso))
}

export function formatLongDay(iso: string): string {
  return longDayFormatter.format(new Date(iso))
}

export function formatMonthDay(iso: string): string {
  return monthDayFormatter.format(new Date(iso))
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)
  const minutes = Math.round(abs / 60_000)
  const suffix = diff < 0 ? 'ago' : 'ahead'
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ${suffix}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ${suffix}`
  const days = Math.round(hours / 24)
  if (days === 1) return diff < 0 ? 'yesterday' : 'tomorrow'
  if (days < 14) return `${days} days ${suffix}`
  return formatDay(iso)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

export function formatMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(minorUnits / 100)
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

export function daysUntil(iso: string): number {
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Late evening'
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
