/**
 * Org routes — organization settings endpoints.
 *
 * All routes require a valid JWT (authMiddleware).
 * Mounted at /api/org in server/index.ts.
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { handleGetOrg, handleUpdateOrg } from '../controller/org.controller'

const org = new Hono()

// Require authentication on every route in this sub-app
org.use('*', authMiddleware)

org.get('/', handleGetOrg)
org.patch('/', handleUpdateOrg)

export default org
