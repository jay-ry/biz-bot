/**
 * E2E smoke test — exercises the full ingest → analytics pipeline against a
 * real database (DATABASE_URL must be set).  No mocking is used.
 *
 * Flow:
 *   1. Sign up a fresh user and obtain a JWT.
 *   2. Ingest a short text document; expect { id, status: 'pending' }.
 *   3. Poll GET /api/ingest until the document status becomes 'ready' (or skip if
 *      OPENAI_API_KEY is absent).
 *   4. Call GET /api/analytics/summary?range=30d; verify counts are non-negative.
 *
 * Cleanup: the org and its user are deleted in afterAll.
 */

if (!process.env.DATABASE_URL) {
  console.warn('Skipping smoke tests: DATABASE_URL not set')
  process.exit(0)
}

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { signUp } from '../services/auth.service'
import { db } from '../db/connection'
import { users, organizations } from '../db/schema'
import { eq } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// App — use the Hono fetch handler directly; no HTTP server needed.
// Dynamically imported inside beforeAll so the DATABASE_URL guard above runs
// before any transitive module (e.g. chat.service.ts → openai SDK) is loaded.
// ---------------------------------------------------------------------------
let appFetch: (req: Request) => Promise<Response>

/** Call the app in-process. */
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
// Shared state — populated in beforeAll, consumed across it() blocks.
// ---------------------------------------------------------------------------
let token: string
let orgId: string
let docId: string

// ---------------------------------------------------------------------------
// Setup & Teardown
// ---------------------------------------------------------------------------
beforeAll(async () => {
  const { default: serverModule } = await import('../index')
  appFetch = serverModule.fetch

  const email = `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`
  token = await signUp(email, 'SmokePass123!', `Smoke Org ${Date.now()}`)

  // Decode JWT payload (no re-verification needed — just for cleanup)
  const parts = token.split('.')
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  orgId = payload.orgId
})

afterAll(async () => {
  if (!orgId) return
  // Delete in FK order: users reference organizations
  await db.delete(users).where(eq(users.orgId, orgId)).catch(() => null)
  await db.delete(organizations).where(eq(organizations.id, orgId)).catch(() => null)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('E2E smoke test', () => {
  it('signs up and gets a valid token', () => {
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // header.payload.signature
    expect(typeof orgId).toBe('string')
    expect(orgId.length).toBeGreaterThan(0)
  })

  it('ingests a text document and returns pending status', async () => {
    const { status, body } = await req('POST', '/api/ingest/text', {
      token,
      body: {
        title: 'Smoke Test Document',
        content:
          'This is a smoke-test knowledge-base entry. It contains enough text to pass the minimum length validation.',
      },
    })

    expect(status).toBe(201)

    const data = body as Record<string, unknown>
    expect(typeof data.id).toBe('string')
    expect(data.status).toBe('pending')

    // Store for subsequent tests
    docId = data.id as string
  })

  it('document becomes ready within 30 seconds', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Skipping document ready check: OPENAI_API_KEY not set')
      return
    }

    const MAX_ATTEMPTS = 15
    const POLL_INTERVAL_MS = 2000

    let lastStatus: string | undefined

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { status, body } = await req('GET', '/api/ingest', { token })
      expect(status).toBe(200)

      const docs = body as Array<Record<string, unknown>>
      const doc = docs.find((d) => d.id === docId)

      if (doc) {
        lastStatus = doc.status as string
        if (lastStatus === 'ready') {
          // Success — document processed within the timeout window
          return
        }
        if (lastStatus === 'error') {
          throw new Error(`Document processing failed: document ${docId} reached 'error' status`)
        }
      }

      if (attempt < MAX_ATTEMPTS) {
        await Bun.sleep(POLL_INTERVAL_MS)
      }
    }

    throw new Error(
      `Document ${docId} did not reach 'ready' status within ${MAX_ATTEMPTS * POLL_INTERVAL_MS / 1000}s. ` +
        `Last observed status: ${lastStatus ?? 'unknown'}`,
    )
  })

  it('analytics summary returns non-negative counts', async () => {
    const { status, body } = await req('GET', '/api/analytics/summary?range=30d', { token })

    expect(status).toBe(200)

    const data = body as Record<string, unknown>
    expect(typeof data.totalMessages).toBe('number')
    expect(typeof data.unansweredCount).toBe('number')
    expect(typeof data.unansweredRate).toBe('number')
    expect(typeof data.totalConversations).toBe('number')

    expect(data.totalMessages as number).toBeGreaterThanOrEqual(0)
    expect(data.unansweredCount as number).toBeGreaterThanOrEqual(0)
    expect(data.unansweredRate as number).toBeGreaterThanOrEqual(0)
    expect(data.totalConversations as number).toBeGreaterThanOrEqual(0)
  })
})
