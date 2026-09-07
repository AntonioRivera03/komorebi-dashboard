import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog } from '../../shared/ui/Dialog'
import { Icon } from '../../shared/ui/Icon'
import { Kbd } from '../../shared/ui/Kbd'
import { navigation } from '../navigation'
import { useShellOverlay } from '../providers/useShellOverlay'
import { useTheme } from '../providers/useTheme'
import { routes } from '../../shared/lib/routes'
import { CommandPaletteItem } from './CommandPaletteItem'

type Command = { id: string; group: string; label: string; hint?: string; keywords?: string; run: () => void }

/** ⌘K palette: jump to any registered route or run a shell action. */
export function CommandPalette() {
  const { overlay, close, open } = useShellOverlay()
  const { toggle: toggleTheme, theme } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const isOpen = overlay === 'palette'

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => {
      close()
      navigate(to)
    }
    const actions: Command[] = [
      { id: 'capture', group: 'Actions', label: 'Quick capture', hint: 'C', keywords: 'inbox note add', run: () => open('capture') },
      { id: 'voice', group: 'Actions', label: 'Push to talk', hint: 'V', keywords: 'speech mic', run: () => open('voice') },
      { id: 'assistant', group: 'Actions', label: 'Ask the assistant', hint: 'A', keywords: 'chat question', run: () => open('assistant') },
      { id: 'theme', group: 'Actions', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, keywords: 'dark light appearance', run: () => { toggleTheme(); close() } },
      { id: 'settings', group: 'Actions', label: 'Open settings', keywords: 'preferences modules providers', run: go(routes.settings) },
    ]
    const pages: Command[] = navigation.flatMap((group) =>
      group.entries.map((entry) => ({ id: entry.to, group: group.label, label: entry.label, hint: entry.description, keywords: entry.description, run: go(entry.to) })),
    )
    return [...actions, ...pages]
  }, [close, navigate, open, theme, toggleTheme])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter((command) => `${command.label} ${command.group} ${command.keywords ?? ''}`.toLowerCase().includes(needle))
  }, [commands, query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setIndex(0)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [isOpen])

  useEffect(() => setIndex(0), [query])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex((value) => Math.min(filtered.length - 1, value + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex((value) => Math.max(0, value - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      filtered[index]?.run()
    }
  }

  let lastGroup = ''

  return (
    <Dialog open={isOpen} onClose={close} title="Go anywhere" eyebrow="Command palette">
      <div className="palette" onKeyDown={onKeyDown}>
        <div className="palette__input">
          <Icon name="search" size={18} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a page or an action…" aria-label="Search commands" />
          <Kbd>esc</Kbd>
        </div>
        <div className="palette__list" role="listbox" aria-label="Commands">
          {filtered.length === 0 ? <p className="muted small" style={{ padding: 12 }}>No matching page or action.</p> : null}
          {filtered.map((command, position) => {
            const showGroup = command.group !== lastGroup
            lastGroup = command.group
            return (
              <div key={command.id}>
                {showGroup ? <div className="palette__group label">{command.group}</div> : null}
                <CommandPaletteItem label={command.label} hint={command.hint} selected={position === index} onSelect={command.run} onHover={() => setIndex(position)} />
              </div>
            )
          })}
        </div>
        <div className="palette__hint">
          <span>
            <Kbd>↑↓</Kbd> move
          </span>
          <span>
            <Kbd>↵</Kbd> open
          </span>
          <span>
            <Kbd>⌘K</Kbd> toggle
          </span>
        </div>
      </div>
    </Dialog>
  )
}
