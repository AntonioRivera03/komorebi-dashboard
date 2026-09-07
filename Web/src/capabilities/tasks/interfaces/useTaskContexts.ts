import { useEffect, useState } from 'react'
import { listContexts } from './tasksApi'

export function useTaskContexts(): string[] {
  const [contexts, setContexts] = useState<string[]>([])
  useEffect(() => {
    let active = true
    listContexts().then((value) => active && setContexts(value))
    return () => {
      active = false
    }
  }, [])
  return contexts
}
