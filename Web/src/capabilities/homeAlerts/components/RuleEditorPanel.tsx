import { useEffect, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { Select } from '../../../shared/ui/Select'
import { Switch } from '../../../shared/ui/Switch'
import { Notice } from '../../../shared/ui/Notice'
import type { AlertRule, AlertRuleKind } from '../interfaces/types'

type Props = { open: boolean; rule: AlertRule | null; busy?: boolean; onClose: () => void; onSave: (rule: Omit<AlertRule, 'revision' | 'id'> & { id?: string }) => void }

export function RuleEditorPanel({ open, rule, busy, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AlertRuleKind>('device_unavailable')
  const [deviceName, setDeviceName] = useState('')
  const [condition, setCondition] = useState('')
  const [persistence, setPersistence] = useState(30)
  const [quiet, setQuiet] = useState(true)

  useEffect(() => {
    setName(rule?.name ?? '')
    setKind(rule?.kind ?? 'device_unavailable')
    setDeviceName(rule?.deviceName ?? '')
    setCondition(rule?.condition ?? '')
    setPersistence(rule?.persistenceMinutes ?? 30)
    setQuiet(rule?.quietChannel ?? true)
  }, [rule])

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      eyebrow={rule ? `Rule · r${rule.revision}` : 'New rule'}
      title={rule ? rule.name : 'Configure an alert rule'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" busy={busy} disabled={!name.trim()} onClick={() => onSave({ id: rule?.id, name, kind, deviceName, condition, persistenceMinutes: persistence, quietChannel: quiet, enabled: rule?.enabled ?? true })}>
            Save rule
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Kind">
          <Select value={kind} onChange={(event) => setKind(event.target.value as AlertRuleKind)} options={[{ value: 'device_unavailable', label: 'Device unavailable' }, { value: 'threshold', label: 'Persistent threshold' }, { value: 'cycle_finished', label: 'Cycle finished (supported observation)' }]} />
        </Field>
        <Field label="Device">
          <TextInput value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="Soil moisture" />
        </Field>
        <Field label="Condition" hint="deterministic; no model involved">
          <TextInput value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="humidity > 65%" />
        </Field>
        <Field label="Persistence" hint="minutes the condition must hold">
          <TextInput type="number" min={1} value={persistence} onChange={(event) => setPersistence(Number(event.target.value))} />
        </Field>
        <div className="k-row k-row--between">
          <span style={{ fontSize: 12 }}>Deliver on the quiet channel</span>
          <Switch label="Quiet channel" checked={quiet} onChange={setQuiet} />
        </div>
        <Notice glyph="⚙">Hysteresis and per-episode deduplication stop a noisy threshold from creating repeated alerts. Unknown state never satisfies a “completed” or “safe” predicate.</Notice>
      </div>
    </SidePanel>
  )
}
