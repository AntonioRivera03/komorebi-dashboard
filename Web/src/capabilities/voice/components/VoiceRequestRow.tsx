import { Link } from 'react-router'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatRelative } from '../../../shared/lib/format'
import type { VoiceRequest } from '../interfaces/types'
import styles from '../voice.module.css'

export function VoiceRequestRow({ request }: { request: VoiceRequest }) {
  return (
    <div className={styles.request}>
      <div>
        {request.transcript ? <q>{request.transcript}</q> : <span className="muted">No transcript</span>}
        <small>
          {formatRelative(request.createdAt)} · {request.id} · audio {request.audioRetained ? 'retained' : 'deleted'}
          {request.revisions.length ? ` · ${request.revisions.length} correction` : ''}
          {request.error ? ` · ${request.error}` : ''}
        </small>
      </div>
      <div className="k-row">
        {request.routed ? (
          <Link to={request.routed.route ?? '#'}>
            <StatusPill tone={request.routed.status === 'failed' ? 'danger' : 'ok'}>{request.routed.target}</StatusPill>
          </Link>
        ) : (
          <StatusPill tone="danger">{request.phase}</StatusPill>
        )}
      </div>
    </div>
  )
}
