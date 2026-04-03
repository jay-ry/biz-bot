/**
 * Analytics service — all data-access and aggregation logic for the analytics domain.
 *
 * All queries are scoped to a single org via the orgId parameter — cross-tenant
 * data leakage is prevented at the service layer, not just at the route layer.
 */

import { db } from '../db/connection'
import { messages, conversations } from '../db/schema'
import { and, eq, gte, sql, count, lt } from 'drizzle-orm'

/** Supported time-range tokens for summary and messages-over-time endpoints. */
export type AnalyticsRange = 'today' | '7d' | '30d'

/**
 * Build a Date representing the start of the requested range (UTC).
 * - `today`  → start of the current UTC day (00:00:00)
 * - `7d`     → exactly 7 days ago from now
 * - `30d`    → exactly 30 days ago from now
 */
function rangeStart(range: AnalyticsRange): Date {
  const now = new Date()
  switch (range) {
    case 'today': {
      const start = new Date(now)
      start.setUTCHours(0, 0, 0, 0)
      return start
    }
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

/**
 * Summary statistics for an organisation over a given time range.
 */
export interface AnalyticsSummary {
  totalMessages: number
  unansweredCount: number
  unansweredRate: number
  totalConversations: number
}

/**
 * Fetch aggregate summary metrics for the given org and range.
 *
 * @param orgId  The organisation UUID (from JWT payload)
 * @param range  Time-range token: 'today' | '7d' | '30d'
 * @returns      AnalyticsSummary object
 */
export async function getSummary(orgId: string, range: AnalyticsRange): Promise<AnalyticsSummary> {
  const since = rangeStart(range)

  // Count total messages and unanswered messages in a single pass
  const [msgResult] = await db
    .select({
      total: count(),
      unanswered: sql<number>`COUNT(*) FILTER (WHERE ${messages.wasAnswered} = false)`,
    })
    .from(messages)
    .where(
      and(
        eq(messages.orgId, orgId),
        gte(messages.createdAt, since),
      )
    )

  // Count distinct conversations started within the range
  const [convResult] = await db
    .select({ total: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.orgId, orgId),
        gte(conversations.startedAt, since),
      )
    )

  const totalMessages = Number(msgResult?.total ?? 0)
  const unansweredCount = Number(msgResult?.unanswered ?? 0)

  return {
    totalMessages,
    unansweredCount,
    unansweredRate: totalMessages === 0 ? 0.0 : unansweredCount / totalMessages,
    totalConversations: Number(convResult?.total ?? 0),
  }
}

/** A single daily bucket returned by the messages-over-time endpoint. */
export interface DailyBucket {
  date: string  // ISO date string, e.g. "2026-04-01"
  count: number
}

/**
 * Return daily message counts for the given org and range.
 * Rows are grouped by UTC date using date_trunc.
 *
 * @param orgId  The organisation UUID
 * @param range  Time-range token: 'today' | '7d' | '30d'
 * @returns      Array of DailyBucket, ordered by date ascending
 */
export async function getMessagesOverTime(orgId: string, range: AnalyticsRange): Promise<DailyBucket[]> {
  const since = rangeStart(range)

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${messages.createdAt})::date::text`,
      count: count(),
    })
    .from(messages)
    .where(
      and(
        eq(messages.orgId, orgId),
        gte(messages.createdAt, since),
      )
    )
    .groupBy(sql`date_trunc('day', ${messages.createdAt})`)
    .orderBy(sql`date_trunc('day', ${messages.createdAt})`)

  return rows.map((r) => ({
    date: r.date,
    count: Number(r.count),
  }))
}

/** A single hourly bucket returned by the busiest-hours endpoint. */
export interface HourlyBucket {
  hour: number   // 0–23
  count: number
}

/**
 * Return message counts grouped by hour-of-day for the given org.
 * Always uses a fixed 30-day lookback window (last 30 days).
 * Returns all 24 hours (0–23) with count 0 for hours that had no messages.
 *
 * @param orgId  The organisation UUID
 * @returns      Array of 24 HourlyBucket entries, one per hour
 */
export async function getBusiestHours(orgId: string): Promise<HourlyBucket[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${messages.createdAt})::int`,
      count: count(),
    })
    .from(messages)
    .where(
      and(
        eq(messages.orgId, orgId),
        gte(messages.createdAt, since),
      )
    )
    .groupBy(sql`EXTRACT(HOUR FROM ${messages.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${messages.createdAt})`)

  // Build a lookup map so we can fill in zeros for missing hours
  const hourMap = new Map<number, number>()
  for (const r of rows) {
    hourMap.set(Number(r.hour), Number(r.count))
  }

  // Return all 24 hours, defaulting to 0
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap.get(h) ?? 0,
  }))
}

/** A single unanswered message row. */
export interface UnansweredMessage {
  id: string
  content: string
  createdAt: string
}

/**
 * Return the most recent unanswered user messages for the given org.
 * Filters to role = 'user' and wasAnswered = false.
 *
 * @param orgId  The organisation UUID
 * @param limit  Maximum number of rows to return (default: 50)
 * @returns      Array of UnansweredMessage, most recent first
 */
export async function getUnansweredMessages(orgId: string, limit: number): Promise<UnansweredMessage[]> {
  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.orgId, orgId),
        eq(messages.role, 'user'),
        eq(messages.wasAnswered, false),
      )
    )
    .orderBy(sql`${messages.createdAt} DESC`)
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt?.toISOString() ?? '',
  }))
}
