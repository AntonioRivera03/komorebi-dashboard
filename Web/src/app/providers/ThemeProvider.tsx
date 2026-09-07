import { useEffect, useMemo, type ReactNode } from 'react'
import { useLocalStorageState } from '../../shared/hooks/useLocalStorageState'
import { ThemeContext, type Theme, type ThemeApi } from './ThemeContext'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorageState<Theme>('komorebi.theme', systemTheme())

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('komorebi')
    root.dataset.theme = theme
  }, [theme])

  const api = useMemo<ThemeApi>(() => ({ theme, setTheme, toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')) }), [theme, setTheme])

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>
}
