import { useEffect, useState } from 'react'
import { listTopics } from './knowledgeApi'

export function useTopics(): string[] {
  const [topics, setTopics] = useState<string[]>([])
  useEffect(() => {
    let active = true
    listTopics().then((value) => active && setTopics(value))
    return () => {
      active = false
    }
  }, [])
  return topics
}
