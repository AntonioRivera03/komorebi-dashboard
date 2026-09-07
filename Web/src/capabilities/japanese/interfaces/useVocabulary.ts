import { useEffect, useState } from 'react'
import { dailyVocabulary } from './japaneseApi'
import type { VocabCard } from './types'

export function useVocabulary(): VocabCard[] {
  const [cards, setCards] = useState<VocabCard[]>([])
  useEffect(() => {
    let active = true
    dailyVocabulary().then((value) => active && setCards(value))
    return () => {
      active = false
    }
  }, [])
  return cards
}
