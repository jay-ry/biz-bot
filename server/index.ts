import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import orgRoutes from './routes/org'

const app = new Hono()

app.use('*', logger())

// Dashboard / admin routes — restricted to the client origin.
app.use('/api/org/*', cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))

app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Org settings routes — protected by authMiddleware inside the sub-router.
app.route('/api/org', orgRoutes)

export default {
  port: process.env.PORT ?? 3001,
  fetch: app.fetch,
}
