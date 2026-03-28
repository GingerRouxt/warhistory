import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

type AdFormat = 'auto' | 'horizontal' | 'vertical'

interface AdPlaceholderProps {
  slot: string
  format?: AdFormat
  className?: string
}

export function AdPlaceholder({ slot, format = 'auto', className = '' }: AdPlaceholderProps) {
  const adRef = useRef<HTMLModElement>(null)
  const [adsAvailable, setAdsAvailable] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      setAdsAvailable(true)
    }
  }, [])

  useEffect(() => {
    if (!adsAvailable || !adRef.current) return

    try {
      (window.adsbygoogle ?? []).push({})
    } catch {
      // AdSense not ready or blocked — fail silently
    }
  }, [adsAvailable])

  if (!adsAvailable) return null

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        data-ad-format={format}
        data-ad-slot={slot}
        data-full-width-responsive="true"
        style={{ display: 'block' }}
      />
    </div>
  )
}
