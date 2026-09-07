import { useEffect, useState } from 'react'
import { getVoiceCapability } from './voiceApi'
import type { VoiceCapability } from './types'

export function useVoiceCapability(): VoiceCapability | null {
  const [capability, setCapability] = useState<VoiceCapability | null>(null)
  useEffect(() => {
    let active = true
    getVoiceCapability().then((value) => active && setCapability(value))
    return () => {
      active = false
    }
  }, [])
  return capability
}
