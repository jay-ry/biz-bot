/**
 * Widget routes.
 *
 * Public-facing routes consumed by the embeddable chat widget.
 * CORS is permissive (`origin: '*'`) because widget users load the script
 * from arbitrary third-party domains — this is intentional and expected.
 *
 * Routes:
 *   GET  /api/widget-config  — fetch org theming config by public token
 *   POST /api/chat           — start a streaming SSE chat turn
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handleWidgetConfig } from '../controller/widget.controller'
import { handleChat } from '../controller/chat.controller'

const widget = new Hono()

widget.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }))
widget.get('/widget-config', handleWidgetConfig)
widget.post('/chat', handleChat)

export default widget
