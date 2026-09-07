import { Link } from 'react-router'
import { Panel } from '../../../shared/ui/Panel'
import { PanelHead } from '../../../shared/ui/PanelHead'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { formatTime, isSameDay } from '../../../shared/lib/format'
import { routes } from '../../../shared/lib/routes'
import { useTodayAgenda } from '../interfaces/useTodayAgenda'
import { WeekStrip } from './WeekStrip'
import styles from '../today.module.css'

export function AgendaWidget() {
  const agenda = useTodayAgenda()
  return (
    <Panel className="agenda" aria-label="Agenda">
      <PanelHead title="Agenda" eyebrow="Calendar · bounded range" actions={<Link to={routes.calendar} className="k-ref">open calendar →</Link>} />
      <WeekStrip />
      <AsyncPanel query={agenda} skeletonLines={3}>
        {({ data }) => (
          <>
            {data.map((entry) => (
              <div key={entry.id} className={styles.event}>
                <time dateTime={entry.at}>{isSameDay(entry.at, new Date()) ? formatTime(entry.at) : `tmrw ${formatTime(entry.at)}`}</time>
                <div>
                  <strong>{entry.title}</strong>
                  <small>{entry.detail}</small>
                </div>
                <span className={styles.eventDot} data-kind={entry.kind} title={entry.kind === 'block' ? 'internal block' : 'provider event'} />
              </div>
            ))}
          </>
        )}
      </AsyncPanel>
    </Panel>
  )
}
