import { NavLink, useLocation } from 'react-router'
import { groupForPath } from '../navigation'

/** Second-level navigation for the active route group; hidden for single-entry groups. */
export function SubNav() {
  const { pathname } = useLocation()
  const group = groupForPath(pathname)
  if (!group || group.entries.length < 2) return null
  return (
    <nav className="subnav" aria-label={`${group.label} sections`}>
      {group.entries.map((entry) => (
        <NavLink key={entry.to} to={entry.to} end={entry.to === '/learn'} aria-current={pathname === entry.to || (entry.to !== '/learn' && pathname.startsWith(`${entry.to}/`)) ? 'page' : undefined} title={entry.description}>
          {entry.label}
          {entry.priority && entry.priority !== 'essential' ? <span className="subnav__priority">{entry.priority}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}
