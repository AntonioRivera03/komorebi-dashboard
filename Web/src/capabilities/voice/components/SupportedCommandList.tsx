import { StatusPill } from '../../../shared/ui/StatusPill'
import { supportedCommands } from '../interfaces/voiceApi'
import styles from '../voice.module.css'

export function SupportedCommandList() {
  return (
    <ul className={styles.commands}>
      {supportedCommands.map((command) => (
        <li key={command.pattern}>
          <div>
            <code>{command.pattern}</code>
            <small>{command.example}</small>
          </div>
          <div className="k-row">
            <StatusPill tone="soft">{command.target}</StatusPill>
            <StatusPill tone={command.confirmation === 'preview' ? 'warn' : 'ok'}>{command.confirmation === 'preview' ? 'preview first' : 'direct'}</StatusPill>
          </div>
        </li>
      ))}
    </ul>
  )
}
