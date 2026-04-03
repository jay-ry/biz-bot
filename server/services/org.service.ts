import { db } from '../db/connection'
import { organizations } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Shape of the fields that callers may update via PATCH /api/org.
 * All fields are optional — only provided fields are applied to the row.
 */
export interface OrgUpdates {
  botName?: string
  brandColor?: string
  systemPrompt?: string
  allowedOrigins?: string[]
}

/**
 * Retrieve a single organization by its primary key.
 *
 * @param orgId  UUID of the organization
 * @returns The organization row, or null if not found
 */
export async function getOrgById(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  return org ?? null
}

/**
 * Update writable settings fields for an organization.
 * Only fields present in `updates` are modified; absent fields are left unchanged.
 *
 * @param orgId    UUID of the organization to update
 * @param updates  Partial object containing only the fields to overwrite
 * @returns The updated organization row, or null if the org was not found
 */
export async function updateOrg(orgId: string, updates: OrgUpdates) {
  // Build the set object with only the provided (non-undefined) fields.
  // Drizzle will throw if we pass an empty set, so we guard against that.
  const set: Partial<typeof updates> = {}
  if (updates.botName !== undefined)        set.botName        = updates.botName
  if (updates.brandColor !== undefined)     set.brandColor     = updates.brandColor
  if (updates.systemPrompt !== undefined)   set.systemPrompt   = updates.systemPrompt
  if (updates.allowedOrigins !== undefined) set.allowedOrigins = updates.allowedOrigins

  if (Object.keys(set).length === 0) {
    // Nothing to update — return the current row unchanged
    return getOrgById(orgId)
  }

  const [updated] = await db
    .update(organizations)
    .set(set)
    .where(eq(organizations.id, orgId))
    .returning()

  return updated ?? null
}
