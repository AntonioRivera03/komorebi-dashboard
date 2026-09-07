import { PageHeader } from '../../../shared/ui/PageHeader'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { useVoiceCapability } from '../interfaces/useVoiceCapability'
import { useRecentRequests } from '../interfaces/useRecentRequests'
import { PushToTalkStage } from '../components/PushToTalkStage'
import { SupportedCommandList } from '../components/SupportedCommandList'
import { VoiceRequestRow } from '../components/VoiceRequestRow'

export default function VoicePage() {
  const capability = useVoiceCapability()
  const recent = useRecentRequests()
  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Assistance · I04"
        title="Voice"
        subtitle="A short spoken request when your hands are busy. Every session is intentional; there is no wake word."
        actions={
          capability ? (
            <>
              <StatusPill tone={capability.microphone === 'granted' ? 'ok' : capability.microphone === 'prompt' ? 'neutral' : 'danger'} dot>
                mic · {capability.microphone}
              </StatusPill>
              <StatusPill tone={capability.transcriptionProvider === 'ready' ? 'ok' : 'danger'} dot>
                speech · {capability.transcriptionProvider}
              </StatusPill>
              <StatusPill>retention · {capability.retention.replaceAll('_', ' ')}</StatusPill>
            </>
          ) : null
        }
      />
      <div className="k-grid k-grid--2">
        <Panel variant="filled">
          <PanelHead title="Push to talk" eyebrow="Session" />
          <PushToTalkStage capability={capability} />
        </Panel>
        <div className="k-stack">
          <Panel>
            <PanelHead title="Supported commands" eyebrow="Constrained intent router" />
            <SupportedCommandList />
            <div style={{ marginTop: 16 }}>
              <Notice glyph="⚠">An unsupported command presents a limitation rather than improvising a service call. A display session's microphone cannot acquire owner scopes.</Notice>
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Recent requests" eyebrow="Stable IDs across retries" />
            <AsyncPanel query={recent}>{({ data }) => data.map((request) => <VoiceRequestRow key={request.id} request={request} />)}</AsyncPanel>
          </Panel>
        </div>
      </div>
    </div>
  )
}
