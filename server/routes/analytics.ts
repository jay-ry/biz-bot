/**
 * Analytics routes — read-only analytics endpoints for the dashboard.
 *
 * All routes require a valid JWT (authMiddleware).
 * Mounted at /api/analytics in server/index.ts.
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import {
  handleGetSummary,
  handleGetMessagesOverTime,
  handleGetBusiestHours,
  handleGetUnanswered,
} from '../controller/analytics.controller'

const analytics = new Hono()

// Require authentication on every route in this sub-app
analytics.use('*', authMiddleware)

analytics.get('/summary', handleGetSummary)
analytics.get('/messages-over-time', handleGetMessagesOverTime)
analytics.get('/busiest-hours', handleGetBusiestHours)
analytics.get('/unanswered', handleGetUnanswered)

export default analytics
