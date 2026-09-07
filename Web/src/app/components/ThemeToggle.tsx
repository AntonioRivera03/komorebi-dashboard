import { IconButton } from '../../shared/ui/IconButton'
import { useTheme } from '../providers/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggle} />
}
