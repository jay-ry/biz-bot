/**
 * Integration tests for GET /api/org and PATCH /api/org
 *
 * Uses the real database (DATABASE_URL must be set) and the real JWT secret
 * (JWT_SECRET must be set). No mocking — every test hits the actual Hono app
 * via its fetch handler and the real Postgres connection.
 *
 * Each test that needs an authenticated user creates a unique org/user pair
 * via signUp() so tests are fully isolated.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { signUp } from '../services/auth.service'
import { db } from '../db/connection'
import { users, organizations } from '../db/schema'
import { eq } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// App import — index.ts exports { port, fetch: app.fetch }.
// We use that fetch handler directly so no HTTP server is needed.
// ---------------------------------------------------------------------------
import server from '../index'

const { fetch: appFetch } = server

/** Helper: call the app in-process with a given method/url/headers/body. */
async function req(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`

  const init: RequestInit = {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  }

  const response = await appFetch(new Request(`http://localhost${path}`, init))
  const body = await response.json().catch(() => null)
  return { status: response.status, body }
}

// ---------------------------------------------------------------------------
// Test data cleanup tracking
// We collect org IDs created during the test run and delete them in afterAll.
// ---------------------------------------------------------------------------
const createdOrgIds: string[] = []

/** Create a unique test user+org and return the JWT. */
async function createTestUser(): Promise<{ token: string; orgId: string }> {
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`
  const token = await signUp(email, 'password123', `Test Org ${Date.now()}`)

  // Decode the token (without re-verifying) to get the orgId for cleanup
  const parts = token.split('.')
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  createdOrgIds.push(payload.orgId)

  return { token, orgId: payload.orgId }
}

// ---------------------------------------------------------------------------
// Clean up all test data after the suite runs
// ---------------------------------------------------------------------------
afterAll(async () => {
  for (const orgId of createdOrgIds) {
    // Delete users first (FK references org)
    await db.delete(users).where(eq(users.orgId, orgId)).catch(() => null)
    await db.delete(organizations).where(eq(organizations.id, orgId)).catch(() => null)
  }
})

// ---------------------------------------------------------------------------
// GET /api/org
// ---------------------------------------------------------------------------
describe('GET /api/org', () => {
  it('returns org data for an authenticated user', async () => {
    const { token } = await createTestUser()

    const { status, body } = await req('GET', '/api/org', { token })

    expect(status).toBe(200)
    const data = body as Record<string, unknown>
    expect(typeof data.id).toBe('string')
    expect(typeof data.name).toBe('string')
    expect(typeof data.publicToken).toBe('string')
    // botName and brandColor have DB defaults
    expect(data.botName).toBeDefined()
    expect(data.brandColor).toBeDefined()
    // Keys must be present (even if null)
    expect('systemPrompt' in data).toBe(true)
    expect('allowedOrigins' in data).toBe(true)
  })

  it('returns 401 when no Authorization header is provided', async () => {
    const { status, body } = await req('GET', '/api/org')

    expect(status).toBe(401)
    const data = body as Record<string, unknown>
    expect(data.error).toBeDefined()
  })

  it('returns 401 when an invalid token is provided', async () => {
    const { status, body } = await req('GET', '/api/org', { token: 'not.a.valid.token' })

    expect(status).toBe(401)
    const data = body as Record<string, unknown>
    expect(data.error).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/org
// ---------------------------------------------------------------------------
describe('PATCH /api/org', () => {
  it('updates botName and brandColor successfully', async () => {
    const { token } = await createTestUser()

    const { status, body } = await req('PATCH', '/api/org', {
      token,
      body: { botName: 'TestBot', brandColor: '#ff0000' },
    })

    expect(status).toBe(200)
    const data = body as Record<string, unknown>
    expect(data.botName).toBe('TestBot')
    expect(data.brandColor).toBe('#ff0000')
    // Other fields still present
    expect(typeof data.id).toBe('string')
    expect(typeof data.publicToken).toBe('string')
  })

  it('rejects an invalid hex color with 400', async () => {
    const { token } = await createTestUser()

    const { status, body } = await req('PATCH', '/api/org', {
      token,
      body: { brandColor: 'notahex' },
    })

    expect(status).toBe(400)
    const data = body as Record<string, unknown>
    expect(data.error).toBeDefined()
  })

  it('returns 401 when no Authorization header is provided', async () => {
    const { status, body } = await req('PATCH', '/api/org', {
      body: { botName: 'ShouldFail' },
    })

    expect(status).toBe(401)
    const data = body as Record<string, unknown>
    expect(data.error).toBeDefined()
  })

  it('rejects an empty body with 400', async () => {
    const { token } = await createTestUser()

    const { status, body } = await req('PATCH', '/api/org', {
      token,
      body: {},
    })

    expect(status).toBe(400)
    const data = body as Record<string, unknown>
    expect(data.error).toBeDefined()
  })

  it('persists updates — a subsequent GET reflects the patched values', async () => {
    const { token } = await createTestUser()

    await req('PATCH', '/api/org', {
      token,
      body: { botName: 'PersistBot', brandColor: '#abc123' },
    })

    const { status, body } = await req('GET', '/api/org', { token })
    expect(status).toBe(200)
    const data = body as Record<string, unknown>
    expect(data.botName).toBe('PersistBot')
    expect(data.brandColor).toBe('#abc123')
  })

  it('updates only the provided field, leaving others unchanged', async () => {
    const { token } = await createTestUser()

    // First set both fields
    await req('PATCH', '/api/org', {
      token,
      body: { botName: 'InitialName', brandColor: '#111111' },
    })

    // Then update only botName
    const { status, body } = await req('PATCH', '/api/org', {
      token,
      body: { botName: 'UpdatedName' },
    })

    expect(status).toBe(200)
    const data = body as Record<string, unknown>
    expect(data.botName).toBe('UpdatedName')
    // brandColor must be preserved
    expect(data.brandColor).toBe('#111111')
  })
})
