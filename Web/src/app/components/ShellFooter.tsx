import { Link } from 'react-router'
import { routes } from '../../shared/lib/routes'
import { useNow } from '../../shared/hooks/useNow'

export function ShellFooter() {
  const now = useNow(60_000)
  return (
    <footer className="footer">
      <span>KOMOREBI · CAPABILITY-ORIENTED MONOLITH · WEB {import.meta.env.MODE.toUpperCase()}</span>
      <span>{now.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
      <span>
        <Link to={routes.settings}>Settings</Link> · <Link to={routes.usage}>Usage history</Link>
      </span>
    </footer>
  )
}
