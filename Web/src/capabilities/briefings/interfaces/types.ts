export type BriefingItem = {
  id: string
  kind: 'article' | 'update' | 'calendar' | 'weather' | 'synthesis'
  title: string
  summary: string
  source: { name: string; url?: string; publishedAt?: string; observedAt: string }
  why: string
  topic?: string
  generated?: boolean
  muted?: boolean
}

export type BriefingSnapshot = { id: string; generatedAt: string; budget: number; items: BriefingItem[]; muted: { kind: 'source' | 'topic'; value: string }[]; providerStatus: { name: string; status: 'ok' | 'failed' | 'stale' }[]; aiStatus: 'ok' | 'failed' }

export type FeedSubscription = { id: string; name: string; url: string; kind: 'rss' | 'weather' | 'calendar' | 'knowledge_topics'; enabled: boolean; lastFetchAt?: string; status: 'ok' | 'failed' | 'never' }
