'use client'

import { useState, useEffect, useCallback } from 'react'
import { listDocuments, deleteDocument, type DocumentRecord } from '@/services/ingest'

export function useDocuments() {
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments()
      setDocs(data)
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      setDocs(prev => {
        const hasInProgress = prev.some(d => d.status === 'pending' || d.status === 'processing')
        if (hasInProgress) refresh()
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  async function remove(id: string) {
    await deleteDocument(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return { docs, loading, refresh, remove }
}
