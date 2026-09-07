import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { QuickCaptureDialog } from '../capabilities/capture/components/QuickCaptureDialog'
import { PushToTalkDialog } from '../capabilities/voice/components/PushToTalkDialog'
import { AssistantDrawer } from '../capabilities/assistant/components/AssistantDrawer'
import { CommandPalette } from './components/CommandPalette'
import { DisplayBanner } from './components/DisplayBanner'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { RouteFallback } from './components/RouteFallback'
import { ShellFooter } from './components/ShellFooter'
import { ShellShortcuts } from './components/ShellShortcuts'
import { SubNav } from './components/SubNav'
import { TopBar } from './components/TopBar'
import './shell.css'

/**
 * The application shell owns session status, navigation, theme and route
 * boundaries. Feature route groups own everything inside <Outlet />.
 */
export function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="shell">
      <TopBar />
      <DisplayBanner />
      <SubNav />
      <main className="shell__main" id="main">
        <RouteErrorBoundary resetKey={pathname}>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <ShellFooter />
      <ShellShortcuts />
      <CommandPalette />
      <QuickCaptureDialog />
      <PushToTalkDialog />
      <AssistantDrawer />
    </div>
  )
}
