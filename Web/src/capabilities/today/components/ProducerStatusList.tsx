import { StatusPill } from '../../../shared/ui/StatusPill'
import type { ProducerStatus } from '../interfaces/types'
import styles from '../today.module.css'

const tone = { ok: 'ok', cached: 'warn', timeout: 'warn', failed: 'danger', disabled: 'neutral' } as const

/** One failed or slow producer never blanks the page; each is shown honestly. */
export function ProducerStatusList({ producers }: { producers: ProducerStatus[] }) {
  return (
    <div className={styles.producers} aria-label="Producer status">
      {producers.map((producer) => (
        <StatusPill key={producer.producer} tone={tone[producer.status]} title={producer.note ?? (producer.ms ? `${producer.ms} ms` : undefined)}>
          {producer.producer} · {producer.status}
          {producer.ms !== undefined && producer.status === 'ok' ? ` ${producer.ms}ms` : ''}
        </StatusPill>
      ))}
    </div>
  )
}
