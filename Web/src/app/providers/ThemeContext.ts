import { createContext } from 'react'

export type Theme = 'light' | 'dark'
export type ThemeApi = { theme: Theme; setTheme: (theme: Theme) => void; toggle: () => void }
export const ThemeContext = createContext<ThemeApi | null>(null)
