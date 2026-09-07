import { Link } from 'react-router'
import { routes } from '../../../shared/lib/routes'
import type { NoteSourceLink } from '../interfaces/types'

/** Source references stay as references; a deleted source becomes a redacted marker. */
export function SourceLinkList({ links }: { links: NoteSourceLink[] }) {
  if (links.length === 0) return <p className="muted small">No source references attached.</p>
  return (
    <div className="k-row">
      {links.map((link) =>
        link.available ? (
          <Link key={link.id} to={`${routes.library}/${link.sourceId}`} className="k-ref">
            <span className="k-ref__owner">{link.sourceTitle}</span> · {link.locator} · r{link.revision}
          </Link>
        ) : (
          <span key={link.id} className="k-ref k-ref--broken">
            {link.sourceTitle} · {link.locator}
          </span>
        ),
      )}
    </div>
  )
}
