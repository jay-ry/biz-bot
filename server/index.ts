import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth'
import ingestRoutes from './routes/ingest'
import widgetRoutes from './routes/widget'
import copilotRoutes from './routes/copilotkit'
import orgRoutes from './routes/org'
import analyticsRoutes from './routes/analytics'

const app = new Hono()

app.use('*', logger())

// Dashboard / admin routes — restricted to the client origin.
app.use('/api/auth/*', cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))
app.use('/api/ingest/*', cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))
app.use('/api/copilotkit/*', cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))
app.use('/api/org/*', cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))
app.use('/api/analytics/*', cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))
// Widget routes apply their own permissive CORS (origin: '*') inside the router.

app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Auth routes are public — no authMiddleware applied here.
app.route('/api/auth', authRoutes)

// Ingest routes — protected by authMiddleware inside the sub-router.
app.route('/api/ingest', ingestRoutes)

// Widget routes — public, permissive CORS for third-party embed sites.
app.route('/api', widgetRoutes)

// CopilotKit endpoint — accepts requests from the dashboard client.
app.route('/api/copilotkit', copilotRoutes)

// Org settings routes — protected by authMiddleware inside the sub-router.
app.route('/api/org', orgRoutes)

// Analytics routes — protected by authMiddleware inside the sub-router.
app.route('/api/analytics', analyticsRoutes)

export default {
  port: process.env.PORT ?? 3001,
  fetch: app.fetch,
}
