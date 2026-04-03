/**
 * Organisation resolution utilities.
 *
 * Resolves an `Organization` record by its public widget token.
 * The `Organization` type is `InferSelectModel<typeof organizations>` as
 * confirmed in `server/db/types.ts`.
 */

import { db } from '../db/connection'
import { organizations } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { Organization } from '../db/types'

/**
 * Looks up an organisation by its public widget token.
 *
 * Returns `null` when no matching org is found, so callers can return
 * a 401/404 without throwing.
 *
 * @param publicToken - The token embedded in the widget embed snippet.
 * @returns The matching `Organization` row, or `null`.
 */
export async function resolveOrgByToken(publicToken: string): Promise<Organization | null> {
  const [org] = await db.select()
    .from(organizations)
    .where(eq(organizations.publicToken, publicToken))
    .limit(1)
  return org ?? null
}
