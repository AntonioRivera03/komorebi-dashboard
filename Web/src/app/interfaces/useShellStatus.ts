import { useEffect, useState } from 'react'
import { fetchShellStatus, type ShellStatus } from './shellApi'

const initial: ShellStatus = {
  home: 'linking',
  homeDetail: 'Checking the Home Assistant connection',
  ai: 'checking',
  aiDetail: 'Checking the configured provider',
  calendar: 'checking',
  calendarDetail: 'Checking the calendar connection',
}

/** Polls the aggregated shell status. Providers own their state; the shell only displays it. */
export function useShellStatus(): ShellStatus {
  const [status, setStatus] = useState<ShellStatus>(initial)
  useEffect(() => {
    let active = true
    const load = () => fetchShellStatus().then((next) => active && setStatus(next))
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [])
  return status
}
