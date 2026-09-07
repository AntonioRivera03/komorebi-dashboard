import { useContext } from 'react'
import { ThemeContext } from './ThemeContext'

export function useTheme() {
  const api = useContext(ThemeContext)
  if (!api) throw new Error('useTheme must be used within ThemeProvider')
  return api
}
