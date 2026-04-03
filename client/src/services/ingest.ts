import { authHeaders } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface DocumentRecord {
  id: string
  title: string
  sourceType: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  createdAt: string
}

export async function ingestText(title: string, content: string): Promise<{ id: string }> {
  const res = await fetch(`${API}/api/ingest/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content }),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function ingestPdf(title: string, file: File): Promise<{ id: string }> {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', file)
  const res = await fetch(`${API}/api/ingest/pdf`, {
    method: 'POST',
    headers: authHeaders(), // DO NOT set Content-Type for FormData
    body: formData,
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API}/api/ingest`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API}/api/ingest/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
}
