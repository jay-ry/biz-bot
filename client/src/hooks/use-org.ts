'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOrg, updateOrg, type OrgSettings, type OrgUpdateInput } from '@/services/org'

export function useOrg() {
  const [org, setOrg] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getOrg()
      setOrg(data)
      setError(null)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to load settings'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function update(data: OrgUpdateInput): Promise<OrgSettings> {
    const updated = await updateOrg(data)
    setOrg(updated)
    return updated
  }

  return { org, loading, error, updateOrg: update, refresh }
}
