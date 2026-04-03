import { db } from '../db/connection'
import { users, organizations } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sign, verify } from 'hono/jwt'
import { nanoid } from 'nanoid'

/**
 * Our application JWT payload shape.
 * The index signature is required because hono/jwt's JWTPayload type has
 * `[key: string]: unknown`, and `sign()` expects a compatible payload type.
 */
export interface TokenPayload {
  [key: string]: unknown
  sub: string
  orgId: string
  role: string
  exp: number
}

const JWT_SECRET = process.env.JWT_SECRET!
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

/**
 * Register a new user and organization.
 * Creates both rows atomically (Postgres-level); on slug collision retries with a suffix.
 *
 * @param email    User's email address (must be unique)
 * @param password Plain-text password — hashed before storage
 * @param orgName  Display name for the new organization
 * @returns Signed JWT string for the newly created user
 */
export async function signUp(email: string, password: string, orgName: string): Promise<string> {
  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 })

  let slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const publicToken = nanoid(32)

  try {
    const [org] = await db
      .insert(organizations)
      .values({ name: orgName, slug, publicToken })
      .returning()

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, orgId: org.id, role: 'owner' })
      .returning()

    return issueToken(user.id, org.id, user.role!)
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string }

    // Handle unique constraint violation on slug — retry with random suffix
    // DrizzleQueryError wraps pg errors; the pg code lives at err.cause.code
    const pgCode = e.code ?? (err as { cause?: { code?: string } }).cause?.code
    if (e.message?.includes('unique') || pgCode === '23505') {
      slug = slug + '-' + nanoid(4)
      const [org] = await db
        .insert(organizations)
        .values({ name: orgName, slug, publicToken: nanoid(32) })
        .returning()

      const [user] = await db
        .insert(users)
        .values({ email, passwordHash, orgId: org.id, role: 'owner' })
        .returning()

      return issueToken(user.id, org.id, user.role!)
    }
    throw err
  }
}

/**
 * Authenticate a user by email and password.
 *
 * @param email    The user's registered email
 * @param password Plain-text password to verify
 * @returns Signed JWT string on success
 * @throws Error('Invalid credentials') if email not found or password does not match
 */
export async function login(email: string, password: string): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) throw new Error('Invalid credentials')

  const valid = await Bun.password.verify(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  return issueToken(user.id, user.orgId!, user.role!)
}

/**
 * Build and sign a JWT for the given user/org/role.
 * Expiry is set to TOKEN_TTL_SECONDS from now.
 */
async function issueToken(userId: string, orgId: string, role: string): Promise<string> {
  const payload: TokenPayload = {
    sub: userId,
    orgId,
    role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }
  return sign(payload, JWT_SECRET)
}

/**
 * Verify a JWT string and return its decoded payload.
 *
 * @param token Raw JWT string from the Authorization header
 * @throws If the token is invalid or expired
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  // hono/jwt's verify requires an explicit algorithm; cast through unknown because
  // JWTPayload uses [key: string]: unknown rather than our concrete field names.
  const payload = await verify(token, JWT_SECRET, 'HS256')
  return payload as unknown as TokenPayload
}
