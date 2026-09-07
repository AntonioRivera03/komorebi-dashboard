import { NavLink, useLocation } from 'react-router'
import { groupForPath, navigation } from '../navigation'

export function PrimaryNav() {
  const { pathname } = useLocation()
  const activeGroup = groupForPath(pathname)
  return (
    <nav className="nav" aria-label="Primary">
      {navigation.map((group) => (
        <NavLink key={group.id} to={group.to} aria-current={activeGroup?.id === group.id ? 'page' : undefined}>
          {group.label}
        </NavLink>
      ))}
    </nav>
  )
}
