import { Button } from '../../shared/ui/Button'
import { useSession } from '../providers/useSession'

/** Shown while previewing a paired display session so restricted content is expected. */
export function DisplayBanner() {
  const { session, switchRole } = useSession()
  if (session.principal !== 'display') return null
  return (
    <div className="display-banner" role="status">
      <span>Display session · restricted scopes: {session.scopes.join(', ')}</span>
      <Button size="sm" variant="ghost" onClick={() => switchRole('user')}>
        Exit preview
      </Button>
    </div>
  )
}
