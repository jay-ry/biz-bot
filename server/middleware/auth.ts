import { createMiddleware } from 'hono/factory'
import { verifyToken, type TokenPayload } from '../services/auth.service'

// Extend Hono's context variable map so c.get('user') is typed throughout the app
declare module 'hono' {
  interface ContextVariableMap {
    user: TokenPayload
  }
}

/**
 * Authentication middleware for protected routes.
 * Expects an `Authorization: Bearer <jwt>` header.
 * Sets `c.var.user` (TokenPayload) for downstream handlers on success.
 * Returns 401 if the header is missing, malformed, or the token is invalid/expired.
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const payload = await verifyToken(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})
