// A tiny original, ascending C-major flourish. No audio downloads or permissions needed.
let context: AudioContext | undefined

/** Call from a user gesture so the browser permits the eventual completion sound. */
export async function unlockFocusAudio(): Promise<boolean> {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') await context.resume()
    return context.state === 'running'
  } catch {
    return false
  }
}

type Tone = { frequency: number; offset: number; length: number }

function playTune(tones: Tone[], wave: OscillatorType = 'sine', gain = 0.16): boolean {
  if (!context || context.state !== 'running') return false
  const start = context.currentTime + 0.03
  try {
    tones.forEach(({ frequency, offset, length }) => {
      const note = context!.createOscillator()
      const volume = context!.createGain()
      const at = start + offset
      note.type = wave
      note.frequency.setValueAtTime(frequency, at)
      volume.gain.setValueAtTime(0, at)
      volume.gain.linearRampToValueAtTime(gain, at + 0.012)
      volume.gain.exponentialRampToValueAtTime(0.001, at + length)
      note.connect(volume)
      volume.connect(context!.destination)
      note.onended = () => {
        note.disconnect()
        volume.disconnect()
      }
      note.start(at)
      note.stop(at + length + 0.02)
    })
    return true
  } catch {
    // Sound failure must never stop completion or its audit record.
    return false
  }
}

export function playFocusJingle(): boolean {
  return playTune(
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].map((frequency, index) => ({
      frequency,
      offset: index * 0.14,
      length: index === 5 ? 0.65 : 0.25,
    })),
  )
}

/** A one-shot victory flourish: a quick climb, a playful turn, then a warm major chord. */
export function playFocusCelebration(): boolean {
  const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1174.66, 1046.5]
  const offsets = [0, 0.11, 0.22, 0.38, 0.52, 0.66, 0.84]
  return playTune(
    [
      ...melody.map((frequency, index) => ({ frequency, offset: offsets[index], length: 0.22 })),
      ...[523.25, 659.25, 783.99, 1046.5].map((frequency) => ({ frequency, offset: 1.05, length: 0.85 })),
    ],
    'triangle',
    0.075,
  )
}

/** Call only from Finish: silence the alarm immediately, then celebrate once if sound is enabled. */
export function finishFocusSound(enabled: boolean): void {
  stopFocusAlarm()
  if (enabled)
    void unlockFocusAudio().then((ready) => {
      if (ready) playFocusCelebration()
    })
}

let alarm: AudioBufferSourceNode | undefined
let alarmBuffer: AudioBuffer | undefined

/** A native audio loop keeps repeating without depending on background JavaScript timers. */
export function startFocusAlarm(): boolean {
  if (alarm) return true
  if (!context || context.state !== 'running') return false
  try {
    if (!alarmBuffer) {
      const rate = context.sampleRate
      alarmBuffer = context.createBuffer(1, Math.ceil(rate * 1.8), rate)
      const samples = alarmBuffer.getChannelData(0)
      const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
      melody.forEach((frequency, index) => {
        const start = Math.round((0.03 + index * 0.14) * rate)
        const length = index === melody.length - 1 ? 0.65 : 0.25
        for (let i = 0; i < length * rate; i++) {
          const t = i / rate
          const envelope =
            t < 0.012 ? (0.16 * t) / 0.012 : 0.16 * Math.pow(0.001 / 0.16, (t - 0.012) / (length - 0.012))
          samples[start + i] += Math.sin(2 * Math.PI * frequency * t) * envelope
        }
      })
    }
    alarm = context.createBufferSource()
    alarm.buffer = alarmBuffer
    alarm.loop = true
    alarm.connect(context.destination)
    alarm.start()
    return true
  } catch {
    stopFocusAlarm()
    return false
  }
}

/** Stop disconnects immediately, including the tail of the currently playing phrase. */
export function stopFocusAlarm(): void {
  const playing = alarm
  alarm = undefined
  if (!playing) return
  try {
    playing.stop()
  } catch {
    /* It may already have stopped. */
  }
  playing.disconnect()
}
