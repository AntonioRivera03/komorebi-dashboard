import { Popover } from '../../shared/ui/Popover'
import { MenuItem } from '../../shared/ui/MenuItem'
import { useSession } from '../providers/useSession'
import { useShellStatus } from '../interfaces/useShellStatus'

/** Home link, AI provider and session role at a glance; the popover shows the detail. */
export function ShellStatus() {
  const { session, switchRole } = useSession()
  const status = useShellStatus()
  const tone = status.home === 'linked' && status.ai === 'ready' ? '' : status.home === 'unavailable' ? 'k-dot--danger' : 'k-dot--warn'

  return (
    <Popover
      align="right"
      width={280}
      title="Connections"
      trigger={(props) => (
        <span className="top-status">
          <button type="button" {...props} aria-label="Connection status">
            <span className={`k-dot ${tone}`} aria-hidden="true" />
            HOME · {status.home.toUpperCase()} · AI · {status.ai.toUpperCase()}
          </button>
        </span>
      )}
    >
      {(close) => (
        <>
          <MenuItem icon="home" hint={status.home} description={status.homeDetail}>
            Home Assistant
          </MenuItem>
          <MenuItem icon="sparkle" hint={status.ai} description={status.aiDetail}>
            AI gateway
          </MenuItem>
          <MenuItem icon="calendar" hint={status.calendar} description={status.calendarDetail}>
            Calendar provider
          </MenuItem>
          <MenuItem icon="shield" hint={session.principal} description="Switch between the owner session and a paired display session">
            Session · {session.displayName}
          </MenuItem>
          <MenuItem
            icon="eye"
            onClick={() => {
              switchRole(session.principal === 'user' ? 'display' : 'user')
              close()
            }}
          >
            {session.principal === 'user' ? 'Preview as paired display' : 'Return to owner session'}
          </MenuItem>
        </>
      )}
    </Popover>
  )
}
