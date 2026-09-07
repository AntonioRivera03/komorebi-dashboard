import { completed, daysFromNow, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { BriefingSnapshot, FeedSubscription } from './types'

/* Briefings HTTP adapter (mock): /api/v1/briefings/... Every item keeps source and observation metadata. */

let muted: BriefingSnapshot['muted'] = [{ kind: 'source', value: 'Hacker News' }, { kind: 'topic', value: 'crypto' }]
let budget = 5

let subscriptions: FeedSubscription[] = [
  { id: 'fs_1', name: 'Open-Meteo', url: 'https://api.open-meteo.com', kind: 'weather', enabled: true, lastFetchAt: minutesAgo(25), status: 'ok' },
  { id: 'fs_2', name: 'Calendar (minimal agenda)', url: 'internal', kind: 'calendar', enabled: true, lastFetchAt: minutesAgo(6), status: 'ok' },
  { id: 'fs_3', name: 'Nature — Neuroscience', url: 'https://www.nature.com/subjects/neuroscience.rss', kind: 'rss', enabled: true, lastFetchAt: minutesAgo(400), status: 'ok' },
  { id: 'fs_4', name: 'NHK Easy Japanese', url: 'https://www3.nhk.or.jp/news/easy/', kind: 'rss', enabled: true, lastFetchAt: minutesAgo(390), status: 'ok' },
  { id: 'fs_5', name: 'Hacker News', url: 'https://news.ycombinator.com/rss', kind: 'rss', enabled: false, lastFetchAt: minutesAgo(3000), status: 'failed' },
  { id: 'fs_6', name: 'Knowledge topics (working memory, komorebi)', url: 'internal', kind: 'knowledge_topics', enabled: true, status: 'ok' },
]

function build(): BriefingSnapshot {
  const items: BriefingSnapshot['items'] = [
    { id: 'bi_w', kind: 'weather', title: '23° and soft light, high 26°', summary: 'Light cloud until mid-afternoon; balcony plants fine until tomorrow.', source: { name: 'Open-Meteo', observedAt: minutesAgo(25) }, why: 'Weather provider configured; it never guesses.' },
    { id: 'bi_c', kind: 'calendar', title: 'Cognition seminar at 14:30, then a free evening', summary: 'One fixed commitment. Your internal block at 19:30 is proposed by the assistant and still unconfirmed.', source: { name: 'Calendar', observedAt: minutesAgo(6) }, why: 'Minimal agenda summary from Calendar; private details omitted on displays.' },
    { id: 'bi_1', kind: 'article', title: 'Working memory capacity predicts resistance to distraction under load', summary: 'A new study links individual WM capacity to filtering efficiency, echoing load theory.', source: { name: 'Nature — Neuroscience', url: 'https://www.nature.com/', publishedAt: daysFromNow(-1, 9), observedAt: minutesAgo(400) }, why: 'Matches your Knowledge topic “working memory” and this week’s exam prep.', topic: 'working memory' },
    { id: 'bi_2', kind: 'article', title: '木漏れ日 — 秋の光を楽しむ', summary: 'An easy-reader piece about autumn light through trees. 320 characters, N5–N4 vocabulary.', source: { name: 'NHK Easy Japanese', url: 'https://www3.nhk.or.jp/news/easy/', publishedAt: daysFromNow(-1, 7), observedAt: minutesAgo(390) }, why: 'Reading practice at your level and it literally is komorebi.', topic: 'japanese' },
    { id: 'bi_3', kind: 'update', title: 'Anki: FSRS 5 released with a revised difficulty model', summary: 'Relevant if Reviews adopts FSRS; migration is a deliberate choice, not automatic.', source: { name: 'Anki release notes', url: 'https://docs.ankiweb.net/', publishedAt: daysFromNow(-3, 12), observedAt: minutesAgo(400) }, why: 'Your Reviews scheduler decision lists FSRS as a candidate.', topic: 'learning tools' },
    { id: 'bi_s', kind: 'synthesis', title: 'Today in one line', summary: 'A quiet day with one seminar, an evening that could hold the working-memory checkpoint, and two reads that connect to it.', source: { name: 'Generated synthesis', observedAt: nowIso() }, why: 'AI synthesis of the fetched items above; clearly separated from them.', generated: true },
  ]
  return { id: newId('brf'), generatedAt: nowIso(), budget, items: items.filter((item) => !muted.some((m) => (m.kind === 'source' && m.value === item.source.name) || (m.kind === 'topic' && m.value === item.topic))).slice(0, budget + 1), muted, providerStatus: [{ name: 'Open-Meteo', status: 'ok' }, { name: 'Nature RSS', status: 'ok' }, { name: 'NHK RSS', status: 'ok' }, { name: 'Hacker News', status: 'failed' }], aiStatus: 'ok' }
}

let current: BriefingSnapshot = { ...build(), generatedAt: minutesAgo(400) }

export async function getBriefing(): Promise<Snapshot<BriefingSnapshot>> {
  await wait()
  return snapshot(current, 'current', new Date(current.generatedAt))
}

export async function refreshBriefing(): Promise<Operation<BriefingSnapshot>> {
  await wait(1500)
  current = build()
  return completed(current)
}

export async function muteRule(kind: 'source' | 'topic', value: string): Promise<Operation<BriefingSnapshot['muted']>> {
  await wait(160)
  muted = [...muted.filter((m) => !(m.kind === kind && m.value === value)), { kind, value }]
  return completed(muted)
}

export async function unmute(kind: 'source' | 'topic', value: string): Promise<Operation<BriefingSnapshot['muted']>> {
  await wait(120)
  muted = muted.filter((m) => !(m.kind === kind && m.value === value))
  return completed(muted)
}

export async function setBudget(next: number): Promise<Operation<number>> {
  await wait(100)
  budget = next
  return completed(budget)
}

export async function listSubscriptions(): Promise<Snapshot<FeedSubscription[]>> {
  await wait(180)
  return snapshot(subscriptions)
}

export async function toggleSubscription(id: string): Promise<Operation<FeedSubscription>> {
  await wait(140)
  const sub = subscriptions.find((item) => item.id === id)
  if (!sub) return failedOperation('not_found', false)
  sub.enabled = !sub.enabled
  return completed({ ...sub })
}

export async function addSubscription(name: string, url: string): Promise<Operation<FeedSubscription>> {
  await wait(300)
  if (!url.trim()) return failedOperation('validation', false, 'Add a feed URL.')
  const sub: FeedSubscription = { id: newId('fs'), name: name || url, url, kind: 'rss', enabled: true, status: 'never' }
  subscriptions = [...subscriptions, sub]
  return completed(sub)
}

export async function captureFromItem(itemId: string): Promise<Operation<{ captureId: string }>> {
  await wait(300)
  return completed({ captureId: `cap_from_${itemId}` })
}
