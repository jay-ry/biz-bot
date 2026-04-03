'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChatWidget } from './chat-widget'

interface WidgetConfig {
  botName: string
  brandColor: string
}

export function ChatWidgetLoader() {
  const params = useSearchParams()
  const orgToken = params.get('token') ?? ''
  const apiUrl = params.get('api') ?? ''

  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgToken) {
      setError('No token provided.')
      return
    }
    const base = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    fetch(`${base}/api/widget-config?token=${encodeURIComponent(orgToken)}`)
      .then(r => r.ok ? r.json() : Promise.reject('Invalid token'))
      .then(data => setConfig({ botName: data.botName, brandColor: data.brandColor }))
      .catch(() => setError('Failed to load widget config.'))
  }, [orgToken, apiUrl])

  if (error) return <div style={{ padding: 16, color: '#ef4444' }}>{error}</div>
  if (!config) return <div style={{ padding: 16, color: '#9ca3af' }}>Loading...</div>

  return (
    <ChatWidget
      orgToken={orgToken}
      botName={config.botName}
      brandColor={config.brandColor}
      apiUrl={apiUrl || undefined}
    />
  )
}
