/**
 * Chat controller.
 *
 * Thin HTTP handler for `POST /api/chat`. Validates input, delegates to
 * `startChatStream`, and streams tokens back as Server-Sent Events (SSE).
 *
 * SSE format:
 *   - `event: meta` — carries `{ conversationId }` so the client can resume.
 *   - `data: <token>` — one line per streamed token (newlines escaped as `\n`).
 *   - `data: [DONE]`  — signals end of stream.
 */

import type { Context } from 'hono'
import { streamText } from 'hono/streaming'
import { z } from 'zod'
import { startChatStream } from '../services/chat.service'

/** Zod schema for the chat request body. */
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  orgToken: z.string().min(1),
  conversationId: z.string().uuid().nullable().optional(),
  visitorId: z.string().default('anonymous'),
})

/**
 * Handles POST /api/chat.
 *
 * Returns a streaming SSE response. On validation failure returns 400.
 * On invalid token returns 401. On any other error returns 500.
 *
 * @param c - Hono request context.
 * @returns HTTP Response (streaming or JSON error).
 */
export async function handleChat(c: Context): Promise<Response> {
  const body = await c.req.json().catch(() => null)
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { message, orgToken, conversationId, visitorId } = parsed.data

  try {
    const { conversationId: convId, stream } = await startChatStream({
      orgToken,
      message,
      conversationId: conversationId ?? null,
      visitorId,
    })

    c.header('Content-Type', 'text/event-stream')
    c.header('Cache-Control', 'no-cache')
    c.header('Connection', 'keep-alive')

    return streamText(c, async (textStream) => {
      // Send conversation ID first so the client can store it for follow-up turns.
      await textStream.writeln(`event: meta\ndata: ${JSON.stringify({ conversationId: convId })}\n`)
      for await (const token of stream) {
        // Escape embedded newlines so each SSE data line stays on one line.
        const escaped = token.replace(/\n/g, '\\n')
        await textStream.writeln(`data: ${escaped}\n`)
      }
      await textStream.writeln('data: [DONE]\n')
    })
  } catch (err: unknown) {
    const e = err as { message?: string }
    if (e.message === 'Invalid org token') return c.json({ error: 'Invalid token' }, 401)
    console.error('Chat error:', err)
    return c.json({ error: 'Chat unavailable' }, 500)
  }
}
