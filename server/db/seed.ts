/**
 * Seed script — creates an admin user + org from env vars.
 * Run with: bun run db:seed
 *
 * Safe to re-run: skips if the email already exists.
 */
import { db } from './connection'
import { users, organizations } from './schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
const orgName = process.env.SEED_ORG_NAME

if (!email || !password || !orgName) {
  console.error('Missing env vars: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ORG_NAME')
  process.exit(1)
}

const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
if (existing) {
  console.log(`Admin already exists: ${email}`)
  process.exit(0)
}

const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 })
let slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const publicToken = nanoid(32)

let org
try {
  ;[org] = await db.insert(organizations).values({ name: orgName, slug, publicToken }).returning()
} catch (err: unknown) {
  const pgCode = (err as { code?: string; cause?: { code?: string } }).cause?.code ?? (err as { code?: string }).code
  if (pgCode !== '23505') throw err
  slug = slug + '-' + nanoid(4)
  ;[org] = await db.insert(organizations).values({ name: orgName, slug, publicToken: nanoid(32) }).returning()
}
const [user] = await db.insert(users).values({ email, passwordHash, orgId: org!.id, role: 'owner' }).returning()

console.log(`Created org:  ${org!.name} (${org!.id})`)
console.log(`Created user: ${user.email} (${user.id})`)
