/**
 * Analytics controller — thin HTTP handlers for the analytics domain.
 *
 * Each handler:
 *   1. Reads orgId from the JWT payload (set by authMiddleware)
 *   2. Parses + validates query params
 *   3. Delegates to analytics.service
 *   4. Returns JSON
 *
 * Business logic lives exclusively in analytics.service.ts.
 */

import type { Context } from 'hono'
import {
  getSummary,
  getMessagesOverTime,
  getBusiestHours,
  getUnansweredMessages,
  type AnalyticsRange,
} from '../services/analytics.service'

/** Valid range values accepted by range-bearing endpoints. */
const VALID_RANGES: AnalyticsRange[] = ['today', '7d', '30d']

/**
 * Parse and validate the `range` query parameter.
 * Returns the range on success or a 400 Response on failure.
 */
function parseRange(c: Context): AnalyticsRange | Response {
  const raw = c.req.query('range') ?? '30d'
  if (!VALID_RANGES.includes(raw as AnalyticsRange)) {
    return c.json({ error: `Invalid range. Must be one of: ${VALID_RANGES.join(', ')}` }, 400) as Response
  }
  return raw as AnalyticsRange
}

/**
 * GET /api/analytics/summary?range=today|7d|30d
 * Returns aggregate message and conversation counts for the authenticated org.
 */
export async function handleGetSummary(c: Context): Promise<Response> {
  const { orgId } = c.get('user')
  const rangeOrError = parseRange(c)
  if (rangeOrError instanceof Response) return rangeOrError

  const data = await getSummary(orgId, rangeOrError)
  return c.json(data)
}

/**
 * GET /api/analytics/messages-over-time?range=today|7d|30d
 * Returns daily message counts as an array of { date, count } buckets.
 */
export async function handleGetMessagesOverTime(c: Context): Promise<Response> {
  const { orgId } = c.get('user')
  const rangeOrError = parseRange(c)
  if (rangeOrError instanceof Response) return rangeOrError

  const data = await getMessagesOverTime(orgId, rangeOrError)
  return c.json(data)
}

/**
 * GET /api/analytics/busiest-hours
 * Returns 24 hourly buckets (0–23) for the last 30 days.
 * Ignores any range param — window is always 30 days.
 */
export async function handleGetBusiestHours(c: Context): Promise<Response> {
  const { orgId } = c.get('user')
  const data = await getBusiestHours(orgId)
  return c.json(data)
}

/**
 * GET /api/analytics/unanswered?limit=50
 * Returns the most recent unanswered user messages for the authenticated org.
 */
export async function handleGetUnanswered(c: Context): Promise<Response> {
  const { orgId } = c.get('user')

  const rawLimit = c.req.query('limit')
  const limit = rawLimit ? parseInt(rawLimit, 10) : 50

  if (isNaN(limit) || limit < 1 || limit > 500) {
    return c.json({ error: 'limit must be an integer between 1 and 500' }, 400)
  }

  const data = await getUnansweredMessages(orgId, limit)
  return c.json(data)
}
