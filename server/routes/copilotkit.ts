/**
 * CopilotKit route.
 *
 * Exposes a single endpoint (`ALL /api/copilotkit/`) that the CopilotKit
 * frontend SDK can target. The org is resolved from the `?token=` query
 * parameter on every request so each widget instance gets RAG context
 * scoped to its organisation.
 *
 * We use `copilotRuntimeNodeHttpEndpoint` (the generic Node HTTP adapter)
 * because CopilotKit does not ship a Hono-specific adapter. Hono's raw
 * Request object is Web-standard-compliant so the adapter accepts it directly.
 */

import { Hono } from 'hono'
import { copilotRuntimeNodeHttpEndpoint } from '@copilotkit/runtime'
import { resolveOrgByToken } from '../utils/resolve-org'
import { buildCopilotRuntime, getServiceAdapter } from '../services/copilotkit-rag'

const copilotkit = new Hono()

/**
 * Handles all HTTP methods on `/api/copilotkit/`.
 *
 * Resolves the org from `?token`, builds a per-request CopilotRuntime with
 * the correct RAG adapter, then delegates to the standard Node HTTP endpoint
 * which handles the CopilotKit GraphQL protocol and streaming.
 */
copilotkit.all('/', async (c) => {
  const orgToken = c.req.query('token')
  if (!orgToken) return c.json({ error: 'token query param required' }, 400)

  const org = await resolveOrgByToken(orgToken)
  if (!org) return c.json({ error: 'Invalid token' }, 401)

  const systemPromptBase = [
    `You are ${org.botName ?? 'Assistant'}, a helpful assistant for ${org.name}.`,
    `Answer ONLY using the context provided below. Do not make up information.`,
    `Be friendly, concise, and do not use markdown formatting.`,
    org.systemPrompt ? `Additional instructions: ${org.systemPrompt}` : '',
  ].filter(Boolean).join('\n')

  const runtime = buildCopilotRuntime(org.id, systemPromptBase)
  const serviceAdapter = getServiceAdapter(runtime)

  // The endpoint factory returns a function that accepts a Web-standard Request
  // and returns a Response — compatible with Hono's raw request interface.
  const handler = copilotRuntimeNodeHttpEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  })

  // Pass Hono's raw Request object; the handler returns a Response.
  return handler(c.req.raw) as Promise<Response>
})

export default copilotkit
