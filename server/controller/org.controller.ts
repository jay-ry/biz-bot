/**
 * Org controller — thin HTTP handlers for organization settings endpoints.
 *
 * All business logic lives in org.service.ts.
 * Handlers here only: read JWT user, validate input, call service, return response.
 */

import type { Context } from 'hono'
import { z } from 'zod'
import { getOrgById, updateOrg } from '../services/org.service'

/** Zod schema for PATCH /api/org request body. All fields are optional. */
const patchOrgSchema = z.object({
  botName:        z.string().min(1).max(60).optional(),
  brandColor:     z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  systemPrompt:   z.string().max(2000).optional(),
  allowedOrigins: z.array(z.string()).optional(),
})

/**
 * Maps an organization row to the public response shape.
 * Ensures we only expose the fields the API contract specifies.
 */
function toOrgResponse(org: NonNullable<Awaited<ReturnType<typeof getOrgById>>>) {
  return {
    id:             org.id,
    name:           org.name,
    publicToken:    org.publicToken,
    botName:        org.botName,
    brandColor:     org.brandColor,
    systemPrompt:   org.systemPrompt,
    allowedOrigins: org.allowedOrigins,
  }
}

/**
 * GET /api/org
 * Return the authenticated user's organization settings.
 *
 * @param c Hono context (user must be set by authMiddleware)
 * @returns 200 with org data, or 404 if the org no longer exists
 */
export async function handleGetOrg(c: Context): Promise<Response> {
  const { orgId } = c.get('user')

  const org = await getOrgById(orgId)
  if (!org) return c.json({ error: 'Organization not found' }, 404)

  return c.json(toOrgResponse(org))
}

/**
 * PATCH /api/org
 * Update writable settings fields for the authenticated user's organization.
 * Only fields present in the request body are modified.
 *
 * @param c Hono context (user must be set by authMiddleware)
 * @returns 200 with updated org data, 400 on validation error, 404 if org not found
 */
export async function handleUpdateOrg(c: Context): Promise<Response> {
  const { orgId } = c.get('user')

  const body = await c.req.json().catch(() => null)
  const parsed = patchOrgSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const org = await updateOrg(orgId, parsed.data)
  if (!org) return c.json({ error: 'Organization not found' }, 404)

  return c.json(toOrgResponse(org))
}
