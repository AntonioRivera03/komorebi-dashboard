import { useCallback } from 'react'
import { useSnapshotQuery } from '../../../shared/hooks/useSnapshotQuery'
import { snapshot, wait, minutesAgo, completed } from '../../../shared/api/mock'
import type { Operation } from '../../../shared/contracts/common'

export type TodayDevice = { id: string; name: string; room: string; on: boolean; status: 'available' | 'stale' | 'unavailable' | 'unknown'; observedAt: string }
export type TodayScene = { id: string; name: string; active: boolean }
export type TodayHome = { temperature: number; setpoint: number; devices: TodayDevice[]; scenes: TodayScene[]; connection: 'linked' | 'stale' | 'unavailable' }

/*
 * Owner-supplied Home widget data. Today renders it, but every command below goes
 * straight to Home's own public API; Today never becomes an alternate owner.
 */
export function useTodayHome() {
  const query = useSnapshotQuery('today:home-widget', async () => {
    await wait(300)
    return snapshot<TodayHome>({
      temperature: 21.5,
      setpoint: 21,
      connection: 'linked',
      devices: [
        { id: 'dev_floor', name: 'Floor lamp', room: 'Living room', on: true, status: 'available', observedAt: minutesAgo(1) },
        { id: 'dev_shelf', name: 'Shelf light', room: 'Living room', on: true, status: 'available', observedAt: minutesAgo(1) },
        { id: 'dev_desk', name: 'Desk lamp', room: 'Study', on: false, status: 'stale', observedAt: minutesAgo(48) },
        { id: 'dev_balcony', name: 'Balcony string lights', room: 'Balcony', on: false, status: 'unavailable', observedAt: minutesAgo(180) },
      ],
      scenes: [
        { id: 'scn_morning', name: 'Morning', active: false },
        { id: 'scn_focus', name: 'Focus', active: false },
        { id: 'scn_evening', name: 'Evening', active: true },
        { id: 'scn_night', name: 'Night', active: false },
      ],
    })
  })

  const setDevice = useCallback(async (id: string, on: boolean): Promise<Operation<{ confirmed: boolean }>> => {
    await wait(700)
    const device = query.snapshot?.data.devices.find((item) => item.id === id)
    if (device?.status === 'unavailable') return { status: 'failed', code: 'device_unavailable', retryable: true, message: 'Device unavailable; no confirmation possible.' }
    query.mutate((data) => ({ ...data, devices: data.devices.map((item) => (item.id === id ? { ...item, on, status: 'available', observedAt: new Date().toISOString() } : item)) }))
    return completed({ confirmed: true })
  }, [query])

  const applyScene = useCallback(async (id: string): Promise<Operation<{ result: 'completed' | 'partial' }>> => {
    await wait(900)
    query.mutate((data) => ({ ...data, scenes: data.scenes.map((scene) => ({ ...scene, active: scene.id === id })) }))
    return completed({ result: id === 'scn_night' ? 'partial' : 'completed' })
  }, [query])

  const setSetpoint = useCallback(async (value: number): Promise<Operation<number>> => {
    await wait(300)
    query.mutate((data) => ({ ...data, setpoint: value }))
    return completed(value)
  }, [query])

  return { query, setDevice, applyScene, setSetpoint }
}
