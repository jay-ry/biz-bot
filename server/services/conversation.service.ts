/**
 * Conversation service.
 *
 * Manages conversation lifecycle (create / look up) and message persistence.
 * The schema uses `started_at` on conversations and `created_at` on messages —
 * both verified against the Drizzle schema before writing this service.
 */

import { db } from '../db/connection'
import { conversations, messages } from '../db/schema'
import { eq, asc } from 'drizzle-orm'

/**
 * How many exchange turns (user + assistant pairs) to include in the prompt
 * history. Keeping this bounded prevents runaway token usage.
 */
const MAX_HISTORY_TURNS = 6

/**
 * Returns the ID of an existing valid conversation, or creates a new one.
 *
 * A conversation is considered valid when it exists and belongs to the
 * same org as the current request (prevents cross-org data leakage).
 *
 * @param conversationId - Optional ID supplied by the client from a prior turn.
 * @param orgId          - UUID of the requesting organisation.
 * @param visitorId      - Opaque visitor identifier (e.g. anonymous session ID).
 * @returns The conversation ID to use for this request.
 */
export async function getOrCreateConversation(
  conversationId: string | null,
  orgId: string,
  visitorId: string,
): Promise<string> {
  if (conversationId) {
    const [conv] = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    // Only reuse the conversation if it belongs to this org.
    if (conv && conv.orgId === orgId) return conv.id
  }

  const [newConv] = await db.insert(conversations).values({
    orgId,
    visitorId,
  }).returning()
  return newConv.id
}

/**
 * Returns recent message history for a conversation, oldest-first.
 *
 * Limited to `MAX_HISTORY_TURNS * 2` rows (each turn = user + assistant message)
 * so the returned array is ready to pass directly into the LLM messages array.
 *
 * @param conversationId - UUID of the conversation.
 * @returns Array of `{ role, content }` objects ordered by creation time.
 */
export async function getConversationHistory(
  conversationId: string,
): Promise<Array<{ role: string; content: string }>> {
  const msgs = await db.select({
    role: messages.role,
    content: messages.content,
  })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(MAX_HISTORY_TURNS * 2)

  return msgs
}

/**
 * Persists both sides of a completed exchange (user message + assistant reply).
 *
 * `wasAnswered` reflects whether the assistant produced a substantive answer
 * (false when the fallback phrase was returned) — used for analytics.
 *
 * @param conversationId   - UUID of the parent conversation.
 * @param orgId            - UUID of the organisation (denormalised for query efficiency).
 * @param userMessage      - The raw user input.
 * @param assistantMessage - The full assistant response text.
 * @param wasAnswered      - Whether the assistant gave a real answer (not a fallback).
 */
export async function saveMessages(
  conversationId: string,
  orgId: string,
  userMessage: string,
  assistantMessage: string,
  wasAnswered: boolean,
): Promise<void> {
  await db.insert(messages).values([
    { conversationId, orgId, role: 'user', content: userMessage, wasAnswered },
    { conversationId, orgId, role: 'assistant', content: assistantMessage, wasAnswered },
  ])
}
