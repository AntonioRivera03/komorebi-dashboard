import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { Field } from '../../../shared/ui/Field'
import { TextInput } from '../../../shared/ui/TextInput'
import { Select } from '../../../shared/ui/Select'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { Notice } from '../../../shared/ui/Notice'
import { registry } from '../interfaces/automationApi'
import type { AutomationRule } from '../interfaces/types'

type Props = { open: boolean; busy?: boolean; onClose: () => void; onSave: (draft: Pick<AutomationRule, 'name' | 'trigger' | 'conditions' | 'actions'>) => void }

/** Rules choose from a finite typed registry. No expressions, scripts or arbitrary URLs. */
export function RuleDraftDialog({ open, busy, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState(registry.triggers[0].type)
  const [conditions, setConditions] = useState<string[]>([])
  const [actions, setActions] = useState<string[]>([])
  const toggle = (list: string[], set: (next: string[]) => void, value: string) => set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Automation · I05 · rule draft"
      title="Event, conditions, actions"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            busy={busy}
            disabled={!name.trim() || actions.length === 0}
            onClick={() =>
              onSave({
                name,
                trigger: registry.triggers.find((item) => item.type === trigger) as AutomationRule['trigger'],
                conditions: registry.predicates.filter((item) => conditions.includes(item.predicate)),
                actions: registry.actions.filter((item) => actions.includes(item.command)),
              })
            }
          >
            Save draft
          </Button>
        </>
      }
    >
      <div className="k-form">
        <Field label="Name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Field label="Trigger">
          <Select value={trigger} onChange={(event) => setTrigger(event.target.value)} options={registry.triggers.map((item) => ({ value: item.type, label: item.label }))} />
        </Field>
        <Field label="Conditions" hint="unknown data never counts as true">
          <div className="k-stack" style={{ gap: 6 }}>
            {registry.predicates.map((item) => (
              <label key={item.predicate} className="k-row" style={{ fontSize: 12 }}>
                <Checkbox checked={conditions.includes(item.predicate)} onChange={() => toggle(conditions, setConditions, item.predicate)} /> {item.label} <code className="mono muted small">{item.predicate}</code>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Actions" hint="owner commands with run_id + step_id keys">
          <div className="k-stack" style={{ gap: 6 }}>
            {registry.actions.map((item) => (
              <label key={item.command} className="k-row" style={{ fontSize: 12 }}>
                <Checkbox checked={actions.includes(item.command)} onChange={() => toggle(actions, setActions, item.command)} /> {item.label} <code className="mono muted small">{item.command}</code>
              </label>
            ))}
          </div>
        </Field>
        <Notice glyph="✦">The assistant may draft a rule for editing here; saved rules execute deterministically. Destructive actions are excluded from the registry.</Notice>
      </div>
    </Dialog>
  )
}
