import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ProviderConfig } from '../interfaces/types'
import styles from '../settings.module.css'

export function ProviderRow({ provider }: { provider: ProviderConfig }) {
  return (
    <div className={styles.provider}>
      <div>
        <strong style={{ fontWeight: 500 }}>{provider.name}</strong>
        <small>
          {provider.role} · {provider.detail}
        </small>
      </div>
      <div className="k-row">
        {provider.disclosure ? <StatusPill tone={provider.disclosure === 'allowed' ? 'neutral' : 'warn'}>cloud disclosure · {provider.disclosure}</StatusPill> : null}
        <StatusPill tone={provider.status === 'connected' ? 'ok' : provider.status === 'error' ? 'danger' : 'warn'} dot>
          {provider.status.replace('_', ' ')}
        </StatusPill>
      </div>
    </div>
  )
}
