import { authHeaders } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface OrgSettings {
  id: string
  name: string
  publicToken: string
  botName: string
  brandColor: string
  systemPrompt: string
  allowedOrigins: string[]
}

export interface OrgUpdateInput {
  botName?: string
  brandColor?: string
  systemPrompt?: string
  allowedOrigins?: string[]
}

export async function getOrg(): Promise<OrgSettings> {
  const res = await fetch(`${API}/api/org`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function updateOrg(data: OrgUpdateInput): Promise<OrgSettings> {
  const res = await fetch(`${API}/api/org`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
