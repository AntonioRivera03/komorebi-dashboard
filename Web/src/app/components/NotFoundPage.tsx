import { Link } from 'react-router'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Button } from '../../shared/ui/Button'
import { routes } from '../../shared/lib/routes'

export function NotFoundPage() {
  return (
    <div style={{ padding: '60px 0' }}>
      <EmptyState
        glyph="〜"
        title="Nothing grows here yet"
        action={
          <Link to={routes.today}>
            <Button variant="primary">Back to Today</Button>
          </Link>
        }
      >
        That route is not registered. Registered routes are listed in the command palette.
      </EmptyState>
    </div>
  )
}
