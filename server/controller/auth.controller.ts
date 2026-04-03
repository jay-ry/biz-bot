import type { Context } from 'hono'
import { signUp, login } from '../services/auth.service'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(80),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * POST /api/auth/signup
 * Validates the request body, registers a new user + org, and returns a JWT.
 * Returns 400 on validation failure, 409 on duplicate email, 500 on unexpected errors.
 */
export async function handleSignUp(c: Context): Promise<Response> {
  const body = await c.req.json().catch(() => null)
  const parsed = signUpSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  try {
    const token = await signUp(parsed.data.email, parsed.data.password, parsed.data.orgName)
    return c.json({ token })
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; cause?: { code?: string } }
    const pgCode = e.code ?? e.cause?.code
    if (e.message?.includes('unique') || pgCode === '23505') {
      return c.json({ error: 'Email already registered' }, 409)
    }
    return c.json({ error: 'Registration failed' }, 500)
  }
}

/**
 * POST /api/auth/login
 * Validates credentials and returns a JWT on success.
 * Returns 400 on validation failure, 401 on bad credentials.
 */
export async function handleLogin(c: Context): Promise<Response> {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  try {
    const token = await login(parsed.data.email, parsed.data.password)
    return c.json({ token })
  } catch {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
}
