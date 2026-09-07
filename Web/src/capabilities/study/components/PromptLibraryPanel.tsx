import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Notice } from '../../../shared/ui/Notice'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { useToast } from '../../../shared/ui/useToast'
import { usePrompts } from '../interfaces/usePrompts'
import { approvePrompt, createPromptDraft, startSession } from '../interfaces/studyApi'
import type { ActivityKind, StudySession } from '../interfaces/types'
import { PromptRow } from './PromptRow'

type Props = { open: boolean; onClose: () => void; onStarted: (session: StudySession) => void }

/** Choose source material and format, review drafts, and start a session with approved prompts. */
export function PromptLibraryPanel({ open, onClose, onStarted }: Props) {
  const prompts = usePrompts()
  const toast = useToast()
  const [selected, setSelected] = useState<string[]>([])
  const [kind, setKind] = useState<ActivityKind>('recall')
  const [drafting, setDrafting] = useState(false)
  const [starting, setStarting] = useState(false)

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      wide
      eyebrow="Study · prompts pin source revisions"
      title="Start a session"
      footer={
        <>
          <Button
            icon="sparkle"
            busy={drafting}
            onClick={async () => {
              setDrafting(true)
              const result = await createPromptDraft('Baddeley (2000)', kind)
              setDrafting(false)
              if (result.status === 'completed') {
                prompts.mutate((items) => [result.value, ...items])
                toast('Draft prompt created · review before approving')
              }
            }}
          >
            Draft a prompt with AI
          </Button>
          <span style={{ flex: 1 }} />
          <Button
            variant="primary"
            disabled={selected.length === 0}
            busy={starting}
            onClick={async () => {
              setStarting(true)
              const result = await startSession(selected, kind, `${kind} · ${selected.length} prompts`)
              setStarting(false)
              if (result.status === 'completed') onStarted(result.value)
              else if (result.status === 'failed') toast(result.message ?? 'Could not start', { tone: 'danger' })
            }}
          >
            Start with {selected.length} prompt{selected.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="k-stack">
        <SegmentedControl<ActivityKind> label="Format" value={kind} onChange={setKind} options={[{ value: 'recall', label: 'Recall' }, { value: 'explanation', label: 'Explanation' }, { value: 'problem', label: 'Problem' }, { value: 'communication', label: 'Communication' }]} />
        <Notice glyph="✦">AI drafts prompts and reference answers from authorized source chunks with locations. Approval is an explicit state; only approved prompts enter practice.</Notice>
        <AsyncPanel query={prompts} skeletonLines={5}>
          {({ data }) => (
            <div>
              {data.map((prompt) => (
                <PromptRow
                  key={prompt.id}
                  prompt={prompt}
                  selected={selected.includes(prompt.id)}
                  onSelect={toggle}
                  onApprove={async (id) => {
                    const result = await approvePrompt(id)
                    if (result.status === 'completed') prompts.mutate((items) => items.map((item) => (item.id === id ? result.value : item)))
                  }}
                />
              ))}
            </div>
          )}
        </AsyncPanel>
      </div>
    </SidePanel>
  )
}
