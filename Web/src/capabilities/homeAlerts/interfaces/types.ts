export type AlertRuleKind = 'device_unavailable' | 'threshold' | 'cycle_finished'
export type AlertSeverity = 'attention' | 'notice'

export type AlertRule = {
  id: string
  name: string
  kind: AlertRuleKind
  deviceName: string
  condition: string
  persistenceMinutes: number
  quietChannel: boolean
  enabled: boolean
  revision: number
}

export type AlertInstance = {
  id: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  openedAt: string
  why: string
  observations: { at: string; value: string; state: 'available' | 'stale' | 'unavailable' | 'unknown' }[]
  condition: 'active' | 'recovered'
  acknowledged?: { at: string; by: string }
  snoozedUntil?: string
  notification: 'delivered' | 'queued' | 'failed' | 'quiet_hours'
}
