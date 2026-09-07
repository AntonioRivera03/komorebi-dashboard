import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useSkillTargets } from '../interfaces/useSkillTargets'
import { useLanguageProfile } from '../interfaces/useLanguageProfile'
import { useVocabulary } from '../interfaces/useVocabulary'
import { setSkillTarget, startPractice } from '../interfaces/japaneseApi'
import { NewTargetDialog } from '../components/NewTargetDialog'
import { SkillTargetCard } from '../components/SkillTargetCard'
import { VocabFlashcard } from '../components/VocabFlashcard'

export default function JapanesePage() {
  const targets = useSkillTargets()
  const profile = useLanguageProfile()
  const vocab = useVocabulary()
  const navigate = useNavigate()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const micBlocked = profile.snapshot?.data.microphone === 'denied' || profile.snapshot?.data.microphone === 'unavailable'

  return (
    <div className="k-page">
      <PageHeader
        eyebrow="Japanese · L06"
        title="Japanese you can use"
        subtitle={profile.snapshot ? `${profile.snapshot.data.purpose} · ${profile.snapshot.data.startingLevel}` : 'Practical targets, trusted material, honest evidence.'}
        actions={
          <>
            {profile.snapshot ? (
              <>
                <StatusPill tone={profile.snapshot.data.speechProvider === 'ready' ? 'ok' : 'danger'} dot>
                  speech · {profile.snapshot.data.speechProvider}
                </StatusPill>
                <StatusPill tone={micBlocked ? 'danger' : 'neutral'} dot>
                  mic · {profile.snapshot.data.microphone}
                </StatusPill>
              </>
            ) : null}
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              New target
            </Button>
          </>
        }
      />
      <div className="k-grid k-grid--2">
        <div>
          <AsyncPanel query={targets} isEmpty={(data) => data.length === 0} empty={<EmptyState glyph="話" title="No targets set">Choose a purpose and define practical targets. Missing curriculum results in an empty setup, not an invented course.</EmptyState>} skeletonLines={8}>
            {({ data }) => (
              <div className="k-stack" style={{ gap: 16 }}>
                {data.map((target) => (
                  <SkillTargetCard
                    key={target.id}
                    target={target}
                    micBlocked={Boolean(micBlocked)}
                    onPractice={async (item, mode) => {
                      const result = await startPractice(item.id, mode)
                      if (result.status === 'completed') {
                        toast(`Study communication session started · ${mode}`)
                        navigate(`${routes.practice}/ses_1`)
                      } else if (result.status === 'failed') toast(result.message ?? 'Cannot start', { tone: 'warn' })
                    }}
                  />
                ))}
              </div>
            )}
          </AsyncPanel>
        </div>
        <div>
          <Panel variant="filled">
            <PanelHead title="Today's word" eyebrow="Vocabulary · separate from evidence" />
            <VocabFlashcard cards={vocab} />
          </Panel>
          <Panel>
            <PanelHead title="How assessment works" />
            <div className="k-stack">
              <Notice glyph="✦">AI role-plays and gives feedback constrained by the selected level and reference material. Generated dialogues and corrections are marked as such.</Notice>
              <Notice glyph="🎙">Pronunciation feedback needs a speech-capable evaluation and evidence; transcription alone is never a pronunciation score. Audio is kept only when you save the attempt.</Notice>
              <Notice glyph="⛨">Study owns the prompts, answers and attachments. Reviews enrollment is an explicit action; a lesson never creates hundreds of cards on its own.</Notice>
            </div>
          </Panel>
        </div>
      </div>
      <NewTargetDialog
        open={creating}
        busy={busy}
        onClose={() => setCreating(false)}
        onCreate={async (title, purpose, modes) => {
          setBusy(true)
          const result = await setSkillTarget(title, purpose, modes)
          setBusy(false)
          if (result.status === 'completed') {
            targets.mutate((items) => [...items, result.value])
            setCreating(false)
            toast('Target added · link lesson material before practising')
          }
        }}
      />
    </div>
  )
}
