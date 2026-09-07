import { Link } from 'react-router'
import { IconButton } from '../../shared/ui/IconButton'
import { routes } from '../../shared/lib/routes'
import { useShellOverlay } from '../providers/useShellOverlay'
import { PrimaryNav } from './PrimaryNav'
import { ShellStatus } from './ShellStatus'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  const { overlay, toggle } = useShellOverlay()
  return (
    <header className="topbar">
      <Link to={routes.today} className="brand" aria-label="Komorebi home">
        <span className="brand__mark" aria-hidden="true">
          木
        </span>
        Komorebi
      </Link>
      <PrimaryNav />
      <div className="topbar__tools">
        <ShellStatus />
        <IconButton icon="search" label="Command palette (⌘K)" onClick={() => toggle('palette')} active={overlay === 'palette'} />
        <IconButton icon="plus" label="Quick capture (C)" onClick={() => toggle('capture')} active={overlay === 'capture'} />
        <IconButton icon="mic" label="Push to talk (V)" onClick={() => toggle('voice')} active={overlay === 'voice'} />
        <IconButton icon="sparkle" label="Assistant (A)" onClick={() => toggle('assistant')} active={overlay === 'assistant'} />
        <ThemeToggle />
      </div>
    </header>
  )
}
