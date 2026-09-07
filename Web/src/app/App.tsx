import { BrowserRouter } from 'react-router'
import { ToastProvider } from '../shared/ui/ToastProvider'
import { SessionProvider } from './providers/SessionProvider'
import { ShellOverlayProvider } from './providers/ShellOverlayProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { LearnProvider } from '../capabilities/learn/LearnProvider'
import { AppRoutes } from './routes'

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <ShellOverlayProvider>
            <BrowserRouter>
              <LearnProvider><AppRoutes /></LearnProvider>
            </BrowserRouter>
          </ShellOverlayProvider>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
