/**
 * Widget controller.
 *
 * Serves the public widget configuration for a given org token.
 * This endpoint is called by the embeddable chat widget on page load
 * to fetch theming and naming values without exposing internal org data.
 */

import type { Context } from 'hono'
import { resolveOrgByToken } from '../utils/resolve-org'

/**
 * Handles GET /api/widget-config?token=<publicToken>.
 *
 * Returns a subset of org settings safe to expose to anonymous widget users.
 * Returns 400 if `token` query param is missing, 404 if no org matches.
 *
 * @param c - Hono request context.
 * @returns JSON `{ botName, brandColor, orgName }` or a JSON error.
 */
export async function handleWidgetConfig(c: Context): Promise<Response> {
  const token = c.req.query('token')
  if (!token) return c.json({ error: 'token required' }, 400)

  const org = await resolveOrgByToken(token)
  if (!org) return c.json({ error: 'Invalid token' }, 404)

  return c.json({
    botName: org.botName ?? 'Assistant',
    brandColor: org.brandColor ?? '#550000',
    orgName: org.name,
  })
}
