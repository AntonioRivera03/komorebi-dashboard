import { useEffect, useState } from 'react'
import { previewConversion } from './captureApi'
import type { ConversionPreview, DestinationKind } from './types'

export function useConversionPreview(captureId: string | null, destination: DestinationKind | null) {
  const [preview, setPreview] = useState<ConversionPreview | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!captureId || !destination) {
      setPreview(null)
      return
    }
    let active = true
    setLoading(true)
    previewConversion(captureId, destination).then((result) => {
      if (active) {
        setPreview(result)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [captureId, destination])
  return { preview, loading }
}
