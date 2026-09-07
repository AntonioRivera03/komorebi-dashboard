import { completed, failedOperation, minutesAgo, newId, nowIso, snapshot, wait } from '../../../shared/api/mock'
import type { Operation, Snapshot } from '../../../shared/contracts/common'
import type { Device, DeviceOperation, HomeConnection, Room, Scene, SceneRun, SceneTarget } from './types'

/* Home HTTP adapter (mock): /api/v1/home/... The Home Assistant adapter is server-side; browsers see Komorebi IDs and typed actions only. */

const rooms: Room[] = [
  { id: 'room_living', name: 'Living room', glyph: '⌂', deviceIds: ['dev_floor', 'dev_shelf', 'dev_ceiling', 'dev_climate'] },
  { id: 'room_study', name: 'Study', glyph: '✎', deviceIds: ['dev_desk', 'dev_monitor'] },
  { id: 'room_bed', name: 'Bedroom', glyph: '☾', deviceIds: ['dev_bedside', 'dev_bed_temp'] },
  { id: 'room_balcony', name: 'Balcony', glyph: '❦', deviceIds: ['dev_balcony', 'dev_soil'] },
]

let devices: Device[] = [
  { id: 'dev_floor', roomId: 'room_living', name: 'Floor lamp', kind: 'light', status: 'available', observedAt: minutesAgo(1), state: { on: true, brightness: 40, colorTemp: 'warm' }, supportedActions: ['toggle', 'brightness', 'colorTemp'], revision: 12 },
  { id: 'dev_shelf', roomId: 'room_living', name: 'Shelf light', kind: 'light', status: 'available', observedAt: minutesAgo(1), state: { on: true, brightness: 60, colorTemp: 'warm' }, supportedActions: ['toggle', 'brightness'], revision: 8 },
  { id: 'dev_ceiling', roomId: 'room_living', name: 'Ceiling', kind: 'light', status: 'available', observedAt: minutesAgo(2), state: { on: false }, supportedActions: ['toggle'], revision: 5 },
  { id: 'dev_climate', roomId: 'room_living', name: 'Thermostat', kind: 'climate', status: 'available', observedAt: minutesAgo(3), state: { setpoint: 21, current: 21.5, humidity: 48 }, supportedActions: ['setpoint'], revision: 30 },
  { id: 'dev_desk', roomId: 'room_study', name: 'Desk lamp', kind: 'light', status: 'stale', observedAt: minutesAgo(48), state: { on: false, brightness: 100, colorTemp: 'neutral' }, supportedActions: ['toggle', 'brightness', 'colorTemp'], revision: 3 },
  { id: 'dev_monitor', roomId: 'room_study', name: 'Monitor light bar', kind: 'switch', status: 'available', observedAt: minutesAgo(1), state: { on: false }, supportedActions: ['toggle'], revision: 2 },
  { id: 'dev_bedside', roomId: 'room_bed', name: 'Bedside lamp', kind: 'light', status: 'available', observedAt: minutesAgo(4), state: { on: false, brightness: 20, colorTemp: 'warm' }, supportedActions: ['toggle', 'brightness'], revision: 7 },
  { id: 'dev_bed_temp', roomId: 'room_bed', name: 'Bedroom sensor', kind: 'sensor', status: 'available', observedAt: minutesAgo(2), state: { current: 20.1, humidity: 51 }, supportedActions: [], revision: 40 },
  { id: 'dev_balcony', roomId: 'room_balcony', name: 'String lights', kind: 'switch', status: 'unavailable', observedAt: minutesAgo(180), state: { on: false }, supportedActions: ['toggle'], revision: 1 },
  { id: 'dev_soil', roomId: 'room_balcony', name: 'Soil moisture', kind: 'sensor', status: 'unknown', observedAt: minutesAgo(190), state: { value: '—' }, supportedActions: [], revision: 9 },
]

let operations: DeviceOperation[] = [
  { id: 'op_h1', deviceId: 'dev_desk', deviceName: 'Desk lamp', action: 'toggle → on', state: 'timed_out', startedAt: minutesAgo(47), detail: 'Sent 08:02:10 · no observed state change in 15 s · not replayed on reconnect' },
]

let scenes: Scene[] = [
  { id: 'scn_evening', name: 'Evening', roomId: 'room_living', revision: 3, origin: 'komorebi', targets: [{ deviceId: 'dev_floor', deviceName: 'Floor lamp', action: 'brightness', value: '40% warm' }, { deviceId: 'dev_shelf', deviceName: 'Shelf light', action: 'brightness', value: '60% warm' }, { deviceId: 'dev_ceiling', deviceName: 'Ceiling', action: 'toggle', value: 'off' }], exposedTo: ['today', 'voice'] },
  { id: 'scn_focus', name: 'Focus', roomId: 'room_study', revision: 2, origin: 'komorebi', targets: [{ deviceId: 'dev_desk', deviceName: 'Desk lamp', action: 'brightness', value: '100% neutral' }, { deviceId: 'dev_monitor', deviceName: 'Monitor light bar', action: 'toggle', value: 'on' }], exposedTo: ['today', 'automation'] },
  { id: 'scn_night', name: 'Night', roomId: 'room_bed', revision: 1, origin: 'komorebi', targets: [{ deviceId: 'dev_bedside', deviceName: 'Bedside lamp', action: 'brightness', value: '10% warm' }, { deviceId: 'dev_balcony', deviceName: 'String lights', action: 'toggle', value: 'off' }], exposedTo: ['voice'] },
  { id: 'scn_morning', name: 'Morning', roomId: 'room_living', revision: 4, origin: 'provider', targets: [{ deviceId: 'dev_ceiling', deviceName: 'Ceiling', action: 'toggle', value: 'on' }, { deviceId: 'dev_climate', deviceName: 'Thermostat', action: 'setpoint', value: '21.5°' }], exposedTo: ['today'] },
  { id: 'scn_broken', name: 'Reading nook', roomId: 'room_living', revision: 2, origin: 'komorebi', targets: [{ deviceId: 'dev_gone', deviceName: '(entity removed)', action: 'toggle', value: 'on' }], exposedTo: [], needsRepair: 'Entity light.reading_nook no longer exists in Home Assistant.' },
]

let runs: SceneRun[] = [
  { id: 'run_1', sceneId: 'scn_evening', sceneName: 'Evening', revision: 3, startedAt: minutesAgo(120), aggregate: 'completed', targets: scenes[0].targets.map((target) => ({ ...target, result: 'confirmed' })), restorable: true },
  { id: 'run_2', sceneId: 'scn_night', sceneName: 'Night', revision: 1, startedAt: minutesAgo(1500), aggregate: 'partial', targets: [{ ...scenes[2].targets[0], result: 'confirmed' }, { ...scenes[2].targets[1], result: 'failed', note: 'String lights unavailable' }], restorable: false },
]

let connection: HomeConnection = { status: 'linked', endpoint: 'http://homeassistant.local:8123', subscription: 'live', snapshotReconciledAt: minutesAgo(2), leasedWorker: 'worker-1', permittedEntities: 10, totalEntities: 37 }

export async function listRooms(): Promise<Snapshot<{ rooms: Room[]; devices: Device[] }>> {
  await wait(260)
  return snapshot({ rooms, devices }, connection.status === 'stale' ? 'stale' : 'current')
}

export async function getConnection(): Promise<Snapshot<HomeConnection>> {
  await wait(150)
  return snapshot(connection)
}

export async function listOperations(): Promise<Snapshot<DeviceOperation[]>> {
  await wait(120)
  return snapshot(operations)
}

/** setDeviceState: queued → sent → acknowledged → confirmed (from observed state). */
export async function setDeviceState(deviceId: string, patch: Device['state'], onProgress?: (state: DeviceOperation['state']) => void): Promise<Operation<Device>> {
  const device = devices.find((item) => item.id === deviceId)
  if (!device) return failedOperation('not_found', false)
  const op: DeviceOperation = { id: newId('op'), deviceId, deviceName: device.name, action: Object.entries(patch).map(([key, value]) => `${key} → ${String(value)}`).join(', '), state: 'queued', startedAt: nowIso(), detail: 'Queued' }
  operations = [op, ...operations]
  if (device.status === 'unavailable') {
    op.state = 'failed'
    op.detail = 'Entity unavailable; command not sent. No confirmation possible.'
    return failedOperation('device_unavailable', true, 'Device unavailable. The command was not sent.')
  }
  await wait(200)
  op.state = 'sent'
  onProgress?.('sent')
  await wait(350)
  op.state = 'acknowledged'
  onProgress?.('acknowledged')
  if (device.status === 'stale') {
    await wait(900)
    op.state = 'unknown_outcome'
    op.detail = 'Acknowledged by Home Assistant but no matching observation arrived. Not claiming success.'
    return { status: 'pending', operationId: op.id, pollUrl: `/api/v1/home/operations/${op.id}` }
  }
  await wait(500)
  op.state = 'confirmed'
  op.detail = 'Observed state matched the command after the operation'
  onProgress?.('confirmed')
  const next: Device = { ...device, state: { ...device.state, ...patch }, status: 'available', observedAt: nowIso(), revision: device.revision + 1 }
  devices = devices.map((item) => (item.id === deviceId ? next : item))
  return completed(next)
}

export async function listScenes(): Promise<Snapshot<{ scenes: Scene[]; runs: SceneRun[] }>> {
  await wait(220)
  return snapshot({ scenes, runs })
}

export async function previewScene(sceneId: string): Promise<Snapshot<{ scene: Scene; predicted: { deviceName: string; from: string; to: string; status: Device['status'] }[] }>> {
  await wait(300)
  const scene = scenes.find((item) => item.id === sceneId) as Scene
  const predicted = scene.targets.map((target) => {
    const device = devices.find((item) => item.id === target.deviceId)
    return { deviceName: target.deviceName, from: device ? (device.state.on === false ? 'off' : `${device.state.brightness ?? ''}% ${device.state.colorTemp ?? ''}`.trim() || 'on') : 'unknown', to: target.value, status: device?.status ?? 'unknown' }
  })
  return snapshot({ scene, predicted })
}

export async function applyScene(sceneId: string, onProgress?: (run: SceneRun) => void): Promise<Operation<SceneRun>> {
  const scene = scenes.find((item) => item.id === sceneId)
  if (!scene) return failedOperation('not_found', false)
  if (scene.needsRepair) return failedOperation('needs_repair', false, scene.needsRepair)
  const run: SceneRun = { id: newId('run'), sceneId, sceneName: scene.name, revision: scene.revision, startedAt: nowIso(), aggregate: 'running', targets: scene.targets.map((target) => ({ ...target, result: 'pending' })), restorable: true }
  runs = [run, ...runs]
  onProgress?.(run)
  for (const target of run.targets) {
    await wait(450)
    const device = devices.find((item) => item.id === target.deviceId)
    if (!device || device.status === 'unavailable') {
      target.result = 'failed'
      target.note = 'unavailable'
    } else if (device.status === 'stale') {
      target.result = 'acknowledged'
      target.note = 'no observation yet'
    } else {
      target.result = 'confirmed'
      devices = devices.map((item) => (item.id === device.id ? { ...item, state: { ...item.state, on: target.value !== 'off' }, observedAt: nowIso(), revision: item.revision + 1 } : item))
    }
    onProgress?.({ ...run, targets: [...run.targets] })
  }
  run.aggregate = run.targets.every((target) => target.result === 'confirmed') ? 'completed' : run.targets.every((target) => target.result === 'failed') ? 'failed' : 'partial'
  return completed({ ...run })
}

export async function restoreSceneRun(runId: string): Promise<Operation<{ restored: string[]; skipped: { name: string; reason: string }[] }>> {
  await wait(800)
  const run = runs.find((item) => item.id === runId)
  if (!run) return failedOperation('not_found', false)
  return completed({ restored: run.targets.slice(0, -1).map((target) => target.deviceName), skipped: run.targets.slice(-1).map((target) => ({ name: target.deviceName, reason: 'changed manually since the scene ran' })) })
}

export async function saveScene(scene: Omit<Scene, 'revision' | 'origin' | 'id'> & { id?: string }): Promise<Operation<Scene>> {
  await wait(300)
  if (!scene.name.trim() || scene.targets.length === 0) return failedOperation('validation', false, 'A scene needs a name and at least one supported target.')
  const existing = scene.id ? scenes.find((item) => item.id === scene.id) : undefined
  const next: Scene = { id: existing?.id ?? newId('scn'), name: scene.name, roomId: scene.roomId, revision: (existing?.revision ?? 0) + 1, origin: 'komorebi', targets: scene.targets, exposedTo: scene.exposedTo }
  scenes = existing ? scenes.map((item) => (item.id === existing.id ? next : item)) : [...scenes, next]
  return completed(next)
}

export async function reconnect(): Promise<Operation<HomeConnection>> {
  await wait(1200)
  connection = { ...connection, status: 'linked', subscription: 'live', snapshotReconciledAt: nowIso() }
  return completed(connection)
}

export function sceneTargetOptions(): SceneTarget[] {
  return devices.filter((device) => device.supportedActions.length > 0).map((device) => ({ deviceId: device.id, deviceName: device.name, action: device.supportedActions[0], value: device.kind === 'climate' ? '21°' : 'on' }))
}
