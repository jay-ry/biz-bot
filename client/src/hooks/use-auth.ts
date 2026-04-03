'use client'

import { useState, useEffect } from 'react'
import { getUser, logout as doLogout, type AuthUser } from '@/services/auth'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setUser(getUser())
    setLoading(false)
  }, [])

  function logout() {
    doLogout()
    setUser(null)
    router.push('/login')
  }

  return { user, loading, logout }
}
