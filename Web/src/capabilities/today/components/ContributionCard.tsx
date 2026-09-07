import { Link } from 'react-router'
import { FreshnessBadge } from '../../../shared/ui/FreshnessBadge'
import { IconButton } from '../../../shared/ui/IconButton'
import { MenuItem } from '../../../shared/ui/MenuItem'
import { Popover } from '../../../shared/ui/Popover'
import { StatusPill } from '../../../shared/ui/StatusPill'
import { formatTime } from '../../../shared/lib/format'
import type { TodayContribution } from '../interfaces/types'
import styles from '../today.module.css'

type Props = {
  contribution: TodayContribution
  pinned: boolean
  onPin: (key: string, pinned: boolean) => void
  onDismiss: (key: string, period: 'hour' | 'today' | 'week') => void
}

const kindTone = { exception: 'warn', commitment: 'accent', action: 'neutral', learning: 'soft', home: 'ok' } as const

export function ContributionCard({ contribution, pinned, onPin, onDismiss }: Props) {
  const isTimed = contribution.kind === 'commitment' && contribution.meta
  return (
    <article className={styles.card} data-kind={contribution.kind} data-pinned={pinned}>
      <div className={styles.cardHead}>
        <StatusPill tone={kindTone[contribution.kind]}>
          {contribution.kind}
          {isTimed ? ` · ${formatTime(contribution.meta as string)}` : ''}
        </StatusPill>
        <div className={styles.cardTools}>
          <IconButton size="sm" icon="pin" label={pinned ? 'Unpin' : 'Pin to Today'} active={pinned} onClick={() => onPin(contribution.key, !pinned)} />
          <Popover
            align="right"
            title="Dismiss for"
            trigger={(props) => <IconButton size="sm" icon="close" label="Dismiss for a while" {...props} />}
          >
            {(close) => (
              <>
                <MenuItem onClick={() => { onDismiss(contribution.key, 'hour'); close() }}>An hour</MenuItem>
                <MenuItem onClick={() => { onDismiss(contribution.key, 'today'); close() }}>The rest of today</MenuItem>
                <MenuItem onClick={() => { onDismiss(contribution.key, 'week'); close() }}>A week</MenuItem>
              </>
            )}
          </Popover>
        </div>
      </div>
      <h3 className={styles.cardTitle}>
        <Link to={contribution.route}>{contribution.title}</Link>
      </h3>
      {contribution.summary ? <p className={styles.cardSummary}>{contribution.summary}</p> : null}
      <div className={styles.cardFoot}>
        <FreshnessBadge freshness={contribution.freshness} observedAt={contribution.observedAt} />
        <Popover align="right" width={280} title={`why · ${contribution.producer}`} direction="up" trigger={(props) => (
          <button type="button" className="k-btn k-btn--ghost k-btn--sm" {...props}>
            why?
          </button>
        )}>
          <p className={styles.why}>
            {contribution.why ?? 'Ranked by the producer within its bounded limit.'}
            <br />
            <span className="mono muted">
              priority {contribution.priority} · {contribution.visibility} · {contribution.resource.owner}/{contribution.resource.kind}
            </span>
          </p>
        </Popover>
      </div>
    </article>
  )
}
