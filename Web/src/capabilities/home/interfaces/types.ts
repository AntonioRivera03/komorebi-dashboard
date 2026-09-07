export type DeviceStatus = 'available' | 'stale' | 'unavailable' | 'unknown'
export type DeviceKind = 'light' | 'switch' | 'climate' | 'sensor'
export type CommandState = 'queued' | 'sent' | 'acknowledged' | 'confirmed' | 'failed' | 'partial' | 'timed_out' | 'unknown_outcome'

export type Device = {
  id: string
  roomId: string
  name: string
  kind: DeviceKind
  status: DeviceStatus
  observedAt: string
  state: { on?: boolean; brightness?: number; colorTemp?: 'warm' | 'neutral' | 'cool'; setpoint?: number; current?: number; humidity?: number; value?: string }
  supportedActions: ('toggle' | 'brightness' | 'colorTemp' | 'setpoint')[]
  revision: number
}

export type Room = { id: string; name: string; glyph: string; deviceIds: string[] }

export type DeviceOperation = { id: string; deviceId: string; deviceName: string; action: string; state: CommandState; startedAt: string; detail: string }

export type SceneTarget = { deviceId: string; deviceName: string; action: string; value: string }
export type SceneRunTarget = SceneTarget & { result: 'confirmed' | 'acknowledged' | 'failed' | 'skipped' | 'pending'; note?: string }

export type Scene = {
  id: string
  name: string
  roomId: string
  revision: number
  origin: 'komorebi' | 'provider'
  targets: SceneTarget[]
  exposedTo: ('today' | 'voice' | 'automation')[]
  needsRepair?: string
}

export type SceneRun = { id: string; sceneId: string; sceneName: string; revision: number; startedAt: string; aggregate: 'completed' | 'partial' | 'failed' | 'running'; targets: SceneRunTarget[]; restorable: boolean }

export type HomeConnection = { status: 'linked' | 'stale' | 'unavailable'; endpoint: string; subscription: 'live' | 'reconnecting' | 'down'; snapshotReconciledAt: string; leasedWorker: string; permittedEntities: number; totalEntities: number }
