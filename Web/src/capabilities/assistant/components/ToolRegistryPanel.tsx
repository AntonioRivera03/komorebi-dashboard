import { SidePanel } from '../../../shared/ui/SidePanel'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { Notice } from '../../../shared/ui/Notice'
import { registeredTools } from '../interfaces/assistantApi'
import styles from '../assistant.module.css'

type Props = { open: boolean; onClose: () => void }

/** The only tools the assistant can call. No runSQL, executeCode or fetchAnyURL exists. */
export function ToolRegistryPanel({ open, onClose }: Props) {
  return (
    <SidePanel open={open} onClose={onClose} eyebrow="Action boundary" title="Registered tools">
      <Notice glyph="⛨">Each tool declares its schema, scope, read/write classification and confirmation policy. A model cannot register new tools or pick a raw endpoint.</Notice>
      <div style={{ marginTop: 16 }}>
        {registeredTools.map((tool) => (
          <div key={tool.name} className={styles.tool}>
            <div>
              <code>{tool.name}</code>
              <small>{tool.description}</small>
              <small>scope {tool.scope} · owner {tool.owner}</small>
            </div>
            <div className="k-row" style={{ alignItems: 'flex-start' }}>
              <StatusPill tone={tool.classification === 'write' ? 'accent' : 'neutral'}>{tool.classification}</StatusPill>
              {tool.confirmation === 'preview' ? <StatusPill tone="warn">preview</StatusPill> : null}
            </div>
          </div>
        ))}
      </div>
    </SidePanel>
  )
}
