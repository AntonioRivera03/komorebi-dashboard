import { Button } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import { Notice } from '../../../shared/ui/Notice'
import { useVoiceSession } from '../interfaces/useVoiceSession'
import type { VoiceCapability } from '../interfaces/types'
import { RoutedOperationCard } from './RoutedOperationCard'
import { TranscriptEditor } from './TranscriptEditor'
import { Waveform } from './Waveform'
import styles from '../voice.module.css'

type Props = { capability: VoiceCapability | null; onDone?: () => void }

const phaseLabel: Record<string, string> = {
  idle: 'hold or tap to start an intentional session',
  listening: 'listening · tap to stop',
  transcribing: 'transcribing',
  review: 'check what was understood',
  routing: 'routing',
  done: 'done',
  failed: 'failed',
  unsupported: 'unsupported',
}

/** Push-to-talk: no wake word, no recording outside an explicit session. */
export function PushToTalkStage({ capability, onDone }: Props) {
  const session = useVoiceSession()
  const phase = session.request?.phase ?? 'idle'
  const blocked = capability?.microphone === 'denied' || capability?.microphone === 'unavailable' || capability?.transcriptionProvider !== 'ready'

  const onMic = () => {
    if (phase === 'idle' || phase === 'done' || phase === 'failed') session.begin()
    else if (phase === 'listening') session.stop()
  }

  return (
    <div className={styles.stage}>
      {capability && blocked ? (
        <Notice tone="warn" glyph="!">
          {capability.microphone === 'denied' ? 'Microphone permission was denied. ' : capability.microphone === 'unavailable' ? 'No microphone is available here. ' : ''}
          {capability.transcriptionProvider !== 'ready' ? 'The transcription provider is not configured. ' : ''}
          Text and touch controls keep working.
        </Notice>
      ) : null}
      <button type="button" className={styles.mic} data-phase={phase} onClick={onMic} disabled={blocked || phase === 'transcribing' || phase === 'routing' || phase === 'review'} aria-label={phaseLabel[phase]}>
        <Icon name={phase === 'listening' ? 'pause' : 'mic'} size={34} />
      </button>
      <Waveform active={phase === 'listening'} />
      <span className={styles.phase}>{phaseLabel[phase]}</span>

      {phase === 'review' && session.request ? (
        <>
          <TranscriptEditor value={session.draft} confidence={session.request.confidence} onChange={session.setDraft} />
          <div className="k-row">
            <Button variant="ghost" onClick={session.reset}>
              Discard
            </Button>
            <Button variant="primary" icon="send" onClick={session.route} disabled={!session.draft.trim()}>
              Route request
            </Button>
          </div>
        </>
      ) : null}

      {phase === 'done' && session.request?.routed ? (
        <>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 16, textAlign: 'center' }}>“{session.request.transcript}”</p>
          <RoutedOperationCard routed={session.request.routed} />
          <div className="k-row">
            <Button onClick={session.reset}>Another request</Button>
            {onDone ? (
              <Button variant="ghost" onClick={onDone}>
                Close
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {phase === 'failed' ? (
        <>
          <Notice tone="danger" glyph="!">
            {session.request?.error ?? 'Something failed.'} Nothing was executed.
          </Notice>
          <Button onClick={session.reset}>Try again</Button>
        </>
      ) : null}

      <p className="muted small" style={{ textAlign: 'center', maxWidth: 360 }}>
        Audio is deleted after transcription unless you explicitly save it. Transcription permission is not permission to act.
      </p>
    </div>
  )
}
