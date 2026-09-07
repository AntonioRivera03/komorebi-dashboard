import { useCallback, useEffect, useState } from 'react'

export function useLocalStorageState<T>(key: string, initial: T): [T, (next: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage may be unavailable; the in-memory state still works */
    }
  }, [key, value])

  const update = useCallback((next: T | ((current: T) => T)) => {
    setValue((current) => (typeof next === 'function' ? (next as (c: T) => T)(current) : next))
  }, [])

  return [value, update]
}
