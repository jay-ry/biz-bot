const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface AuthUser {
  sub: string
  orgId: string
  role: string
  exp: number
}

function parseToken(token: string): AuthUser {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload))
}

export async function apiSignUp(email: string, password: string, orgName: string) {
  const res = await fetch(`${API}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, orgName }),
  })
  if (!res.ok) throw await res.json()
  const { token } = await res.json()
  localStorage.setItem('auth_token', token)
  return parseToken(token)
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw await res.json()
  const { token } = await res.json()
  localStorage.setItem('auth_token', token)
  return parseToken(token)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function getUser(): AuthUser | null {
  const token = getToken()
  if (!token) return null
  try {
    const user = parseToken(token)
    if (user.exp * 1000 < Date.now()) {
      localStorage.removeItem('auth_token')
      return null
    }
    return user
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('auth_token')
}

export function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
