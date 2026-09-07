import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { Select } from '../../../shared/ui/Select'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { Notice } from '../../../shared/ui/Notice'
import { IconButton } from '../../../shared/ui/IconButton'
import { sceneTargetOptions } from '../interfaces/homeApi'
import type { Room, Scene, SceneTarget } from '../interfaces/types'

type Props = { open: boolean; scene: Scene | null; rooms: Room[]; busy?: boolean; onClose: () => void; onSave: (scene: Omit<Scene, 'revision' | 'origin' | 'id'> & { id?: string }) => void }

export function SceneEditorPanel({ open, scene, rooms, busy, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '')
  const [targets, setTargets] = useState<SceneTarget[]>([])
  const [exposed, setExposed] = useState<Scene['exposedTo']>([])
  const options = sceneTargetOptions()

  useEffect(() => {
    setName(scene?.name ?? '')
    setRoomId(scene?.roomId ?? rooms[0]?.id ?? '')
    setTargets(scene?.targets.filter((target) => target.deviceId !== 'dev_gone') ?? [])
    setExposed(scene?.exposedTo ?? [])
  }, [scene, rooms])

  const toggleExposed = (consumer: Scene['exposedTo'][number]) => setExposed((current) => (current.includes(consumer) ? current.filter((item) => item !== consumer) : [...current, consumer]))

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      eyebrow={scene ? `Editing · r${scene.revision} → r${scene.revision + 1}` : 'New scene'}
      title={scene ? scene.name : 'Define a scene'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!name.trim() || targets.length === 0} onClick={() => onSave({ id: scene?.id, name, roomId, targets, exposedTo: exposed })}>
            Save revision
          </Button>
        </>
      }
    >
      <div className="k-form">
        {scene?.needsRepair ? <Notice tone="danger" glyph="!">{scene.needsRepair} Removed targets have been dropped; add a replacement.</Notice> : null}
        <Field label="Name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Room">
          <Select value={roomId} onChange={(event) => setRoomId(event.target.value)} options={rooms.map((room) => ({ value: room.id, label: room.name }))} />
        </Field>
        <Field label="Targets" hint="only supported actions are offered">
          <div className="k-stack" style={{ gap: 6 }}>
            {targets.map((target, index) => (
              <div key={`${target.deviceId}-${index}`} className="k-row">
                <span style={{ flex: 1, fontSize: 12 }}>{target.deviceName}</span>
                <TextInput value={target.value} onChange={(event) => setTargets((current) => current.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))} style={{ width: 120 }} aria-label={`${target.deviceName} value`} />
                <IconButton size="sm" icon="close" label="Remove target" onClick={() => setTargets((current) => current.filter((_, i) => i !== index))} />
              </div>
            ))}
            <Select
              value=""
              aria-label="Add target"
              onChange={(event) => {
                const option = options.find((item) => item.deviceId === event.target.value)
                if (option) setTargets((current) => [...current, option])
              }}
              options={[{ value: '', label: 'Add a device…' }, ...options.filter((option) => !targets.some((target) => target.deviceId === option.deviceId)).map((option) => ({ value: option.deviceId, label: `${option.deviceName} · ${option.action}` }))]}
            />
          </div>
        </Field>
        <Field label="Expose to" hint="permission scope independent of the label">
          <div className="k-row">
            {(['today', 'voice', 'automation'] as const).map((consumer) => (
              <label key={consumer} className="k-row" style={{ fontSize: 12 }}>
                <Checkbox checked={exposed.includes(consumer)} onChange={() => toggleExposed(consumer)} /> {consumer}
              </label>
            ))}
          </div>
        </Field>
        <Notice glyph="✦">The assistant may draft a scene proposal for you to edit here; it cannot silently enable new entity access.</Notice>
      </div>
    </SidePanel>
  )
}
