import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Button } from '../../../shared/ui/Button'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { Notice } from '../../../shared/ui/Notice'
import { useToast } from '../../../shared/ui/useToast'
import { routes } from '../../../shared/lib/routes'
import { useScenes } from '../interfaces/useScenes'
import { useRooms } from '../interfaces/useRooms'
import { applyScene, restoreSceneRun, saveScene } from '../interfaces/homeApi'
import type { Scene, SceneRun } from '../interfaces/types'
import { SceneCard } from '../components/SceneCard'
import { SceneEditorPanel } from '../components/SceneEditorPanel'
import { ScenePreviewDialog } from '../components/ScenePreviewDialog'
import { SceneRunCard } from '../components/SceneRunCard'

export default function ScenesPage() {
  const scenes = useScenes()
  const rooms = useRooms()
  const toast = useToast()
  const [previewing, setPreviewing] = useState<Scene | null>(null)
  const [editing, setEditing] = useState<Scene | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [liveRun, setLiveRun] = useState<SceneRun | null>(null)

  const apply = async (scene: Scene) => {
    setApplying(true)
    setPreviewing(null)
    const result = await applyScene(scene.id, (run) => setLiveRun({ ...run }))
    setApplying(false)
    if (result.status === 'completed') {
      setLiveRun(result.value)
      scenes.mutate((data) => ({ ...data, runs: [result.value, ...data.runs.filter((run) => run.id !== result.value.id)] }))
      rooms.reload()
      toast(result.value.aggregate === 'completed' ? `“${scene.name}” confirmed on every target` : `“${scene.name}” ${result.value.aggregate} · see per-device results`, { tone: result.value.aggregate === 'completed' ? 'neutral' : 'warn' })
    } else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'danger' })
  }

  return (
    <div className="k-page">
      <PageHeader
        back={{ to: routes.home, label: 'Rooms' }}
        eyebrow="Home · H02"
        title="Scenes"
        subtitle="Named sets of supported targets. Preview, apply, and inspect each device's result. Device commands are not a transaction; partial results stay visible."
        actions={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
          >
            New scene
          </Button>
        }
      />
      <div className="k-grid k-grid--2">
        <AsyncPanel query={scenes} skeletonLines={8}>
          {({ data }) => (
            <div className="k-grid k-grid--cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
              {data.scenes.map((scene) => (
                <SceneCard key={scene.id} scene={scene} roomName={rooms.snapshot?.data.rooms.find((room) => room.id === scene.roomId)?.name ?? scene.roomId} busy={applying} onPreview={setPreviewing} onEdit={(item) => { setEditing(item); setEditorOpen(true) }} />
              ))}
            </div>
          )}
        </AsyncPanel>
        <div>
          {liveRun ? (
            <Panel flush>
              <PanelHead title="Latest run" eyebrow="Live per-device results" />
              <SceneRunCard run={liveRun} />
            </Panel>
          ) : null}
          <Panel flush={!liveRun}>
            <PanelHead title="Run history" eyebrow="Pins the scene revision · pre-run snapshots" />
            <AsyncPanel query={scenes} skeletonLines={4}>
              {({ data }) => (
                <div className="k-stack">
                  {data.runs
                    .filter((run) => run.id !== liveRun?.id)
                    .map((run) => (
                      <SceneRunCard
                        key={run.id}
                        run={run}
                        restoring={restoring === run.id}
                        onRestore={async (item) => {
                          setRestoring(item.id)
                          const result = await restoreSceneRun(item.id)
                          setRestoring(null)
                          if (result.status === 'completed') toast(`Restored ${result.value.restored.join(', ')} · skipped ${result.value.skipped.map((s) => `${s.name} (${s.reason})`).join(', ')}`, { durationMs: 7000 })
                        }}
                      />
                    ))}
                </div>
              )}
            </AsyncPanel>
          </Panel>
          <div style={{ marginTop: 16 }}>
            <Notice glyph="⛨">Voice and Automation issue a named scene command, never raw device calls. Disabling Automation leaves every manual scene function intact.</Notice>
          </div>
        </div>
      </div>
      <ScenePreviewDialog scene={previewing} busy={applying} onApply={apply} onClose={() => setPreviewing(null)} />
      <SceneEditorPanel
        open={editorOpen}
        scene={editing}
        rooms={rooms.snapshot?.data.rooms ?? []}
        busy={saving}
        onClose={() => setEditorOpen(false)}
        onSave={async (scene) => {
          setSaving(true)
          const result = await saveScene(scene)
          setSaving(false)
          if (result.status === 'completed') {
            scenes.reload()
            setEditorOpen(false)
            toast(`Scene saved as revision ${result.value.revision}`)
          } else if (result.status === 'failed') toast(result.message ?? 'Failed', { tone: 'danger' })
        }}
      />
    </div>
  )
}
