import { useState, useEffect, useCallback } from 'react'
import {
  fetchSummary,
  fetchMessagesOverTime,
  fetchBusiestHours,
  fetchUnanswered,
  type AnalyticsRange,
  type AnalyticsSummary,
  type MessagesOverTimePoint,
  type BusiestHourPoint,
  type UnansweredQuestion,
} from '@/services/analytics'

interface UseAnalyticsResult {
  summary: AnalyticsSummary | null
  messagesOverTime: MessagesOverTimePoint[]
  busiestHours: BusiestHourPoint[]
  unanswered: UnansweredQuestion[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useAnalytics(range: AnalyticsRange): UseAnalyticsResult {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [messagesOverTime, setMessagesOverTime] = useState<MessagesOverTimePoint[]>([])
  const [busiestHours, setBusiestHours] = useState<BusiestHourPoint[]>([])
  const [unanswered, setUnanswered] = useState<UnansweredQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryData, overTimeData, hoursData, unansweredData] = await Promise.all([
        fetchSummary(range),
        fetchMessagesOverTime(range),
        fetchBusiestHours(),
        fetchUnanswered(),
      ])
      setSummary(summaryData)
      setMessagesOverTime(overTimeData)
      setBusiestHours(hoursData)
      setUnanswered(unansweredData)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { summary, messagesOverTime, busiestHours, unanswered, loading, error, refresh }
}
