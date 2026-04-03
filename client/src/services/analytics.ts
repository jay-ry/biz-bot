import { authHeaders } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export type AnalyticsRange = 'today' | '7d' | '30d'

export interface AnalyticsSummary {
  totalMessages: number
  unansweredCount: number
  unansweredRate: number
  totalConversations: number
}

export interface MessagesOverTimePoint {
  date: string
  count: number
}

export interface BusiestHourPoint {
  hour: number
  count: number
}

export interface UnansweredQuestion {
  id: string
  content: string
  createdAt: string
}

export async function fetchSummary(range: AnalyticsRange): Promise<AnalyticsSummary> {
  const res = await fetch(`${API}/api/analytics/summary?range=${range}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function fetchMessagesOverTime(range: AnalyticsRange): Promise<MessagesOverTimePoint[]> {
  const res = await fetch(`${API}/api/analytics/messages-over-time?range=${range}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function fetchBusiestHours(): Promise<BusiestHourPoint[]> {
  const res = await fetch(`${API}/api/analytics/busiest-hours`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function fetchUnanswered(): Promise<UnansweredQuestion[]> {
  const res = await fetch(`${API}/api/analytics/unanswered?limit=50`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
