import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  playFocusJingle,
  finishFocusSound,
  startFocusAlarm,
  stopFocusAlarm,
  unlockFocusAudio,
} from '../src/capabilities/learn/focusSound.ts'

test('jingle unlocks on demand, plays six bounded notes, and fails safely without audio', async () => {
  assert.equal(playFocusJingle(), false)
  assert.equal(await unlockFocusAudio(), false)
  const starts: number[] = []
  const stops: number[] = []
  const frequencies: number[] = []
  let resumes = 0
  let alarmStarts = 0
  let alarmStops = 0
  let alarmDisconnects = 0
  const sources: { loop: boolean }[] = []
  let samples = new Float32Array()
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext')
  class AudioStub {
    state = 'suspended'
    currentTime = 100
    sampleRate = 48000
    createBuffer(_channels: number, length: number) {
      samples = new Float32Array(length)
      return { getChannelData: () => samples }
    }
    createBufferSource() {
      const source = {
        loop: false,
        buffer: null,
        connect() {},
        start() {
          alarmStarts++
        },
        stop() {
          alarmStops++
        },
        disconnect() {
          alarmDisconnects++
        },
      }
      sources.push(source)
      return source
    }
    destination = {}
    async resume() {
      resumes++
      this.state = 'running'
    }
    createOscillator() {
      return {
        type: '',
        frequency: { setValueAtTime: (hz: number) => frequencies.push(hz) },
        connect() {},
        disconnect() {},
        start: (at: number) => starts.push(at),
        stop: (at: number) => stops.push(at),
        onended: null,
      }
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
      }
    }
  }
  Object.defineProperty(globalThis, 'AudioContext', { value: AudioStub, configurable: true })
  try {
    assert.equal(await unlockFocusAudio(), true)
    assert.equal(await unlockFocusAudio(), true)
    assert.equal(resumes, 1)
    assert.equal(playFocusJingle(), true)
    assert.equal(frequencies.length, 6)
    assert.ok(frequencies.at(-1)! > frequencies[0])
    assert.ok(stops.every((stop, i) => stop > starts[i]))
    assert.ok(stops.at(-1)! - starts[0] < 2)
    assert.equal(startFocusAlarm(), true)
    assert.equal(startFocusAlarm(), true)
    assert.equal(alarmStarts, 1)
    assert.equal(sources[0].loop, true)
    assert.ok(samples.some((sample) => Math.abs(sample) > 0.05))
    assert.ok(samples.every((sample) => Number.isFinite(sample) && Math.abs(sample) < 1))
    assert.ok(samples.slice(-4800).every((sample) => sample === 0))
    stopFocusAlarm()
    stopFocusAlarm()
    assert.equal(alarmStops, 1)
    assert.equal(alarmDisconnects, 1)
    assert.equal(startFocusAlarm(), true)
    assert.equal(alarmStarts, 2)
    const previewNotes = starts.length
    finishFocusSound(true)
    assert.equal(alarmStops, 2, 'Finish immediately stops the alarm')
    await Promise.resolve()
    await Promise.resolve()
    const celebrationStarts = starts.slice(previewNotes)
    const celebrationStops = stops.slice(previewNotes)
    assert.ok(celebrationStarts.length > 0, 'Finish schedules a celebration')
    assert.ok(new Set(celebrationStarts).size < celebrationStarts.length, 'Celebration contains a chord')
    assert.ok(celebrationStops.every((stop, i) => stop > celebrationStarts[i]))
    assert.ok(Math.max(...celebrationStops) - Math.min(...celebrationStarts) < 3)
    assert.equal(alarmStarts, 2, 'Celebration never restarts the loop')
    const afterCelebration = starts.length
    startFocusAlarm()
    finishFocusSound(false)
    await Promise.resolve()
    assert.equal(alarmStops, 3)
    assert.equal(starts.length, afterCelebration, 'Muted Finish stays silent')
  } finally {
    if (original) Object.defineProperty(globalThis, 'AudioContext', original)
    else Reflect.deleteProperty(globalThis, 'AudioContext')
  }
})
