/**
 * Chat service — orchestrates RAG retrieval, conversation history, and streaming
 * DeepSeek inference for the widget chat endpoint.
 *
 * Flow:
 *  1. Resolve org by public token.
 *  2. Get or create a conversation row.
 *  3. Retrieve relevant knowledge-base chunks + prior message history in parallel.
 *  4. Build a system prompt that injects the retrieved context.
 *  5. Stream the DeepSeek response token-by-token via the OpenAI-compatible SDK.
 *  6. After the final token, persist both messages to the DB.
 */

import OpenAI from 'openai'
import { retrieveRelevantChunks } from './retrieval.service'
import { getOrCreateConversation, getConversationHistory, saveMessages } from './conversation.service'
import { resolveOrgByToken } from '../utils/resolve-org'
import type { Organization } from '../db/types'

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

const CHAT_MODEL = 'deepseek-chat'
/** Exact phrase checked to determine if the assistant actually answered the query. */
const FALLBACK_PHRASE = "I'm not sure about that — please contact us directly."

/**
 * Constructs the system prompt that grounds the assistant in retrieved context.
 *
 * @param org          - The organisation row (provides name, botName, systemPrompt).
 * @param contextChunks - Plaintext content strings from the retrieval step.
 * @returns A single formatted system-prompt string.
 */
function buildSystemPrompt(
  org: Pick<Organization, 'name' | 'botName' | 'systemPrompt'>,
  contextChunks: string[],
): string {
  const context = contextChunks.length > 0
    ? contextChunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')
    : 'No relevant context found.'

  return [
    `You are ${org.botName ?? 'Assistant'}, a helpful assistant for ${org.name}.`,
    `Answer ONLY using the context provided below. Do not make up information.`,
    `If you cannot find the answer in the context, respond with exactly: "${FALLBACK_PHRASE}"`,
    `Be friendly, concise, and do not use markdown formatting in your responses.`,
    org.systemPrompt ? `\nAdditional instructions: ${org.systemPrompt}` : '',
    '\n--- Context ---',
    context,
  ].filter(Boolean).join('\n')
}

export interface ChatStreamResult {
  /** The (possibly newly created) conversation UUID to return to the client. */
  conversationId: string
  /** Async iterable of text tokens to stream to the HTTP response. */
  stream: AsyncIterable<string>
}

/**
 * Validates the org token, builds the RAG context, and returns a streaming
 * result object. The caller is responsible for consuming `stream` and writing
 * each yielded token to the HTTP response.
 *
 * Message persistence happens automatically inside the generator once the
 * DeepSeek stream signals `finish_reason: 'stop'`.
 *
 * @param params.orgToken        - Public widget token identifying the organisation.
 * @param params.message         - The user's input message.
 * @param params.conversationId  - Existing conversation ID (null to start a new one).
 * @param params.visitorId       - Opaque visitor identifier for the conversation row.
 * @returns `{ conversationId, stream }` — conversationId must be sent back to the client.
 * @throws Error('Invalid org token') when the token does not match any organisation.
 */
export async function startChatStream(params: {
  orgToken: string
  message: string
  conversationId: string | null
  visitorId: string
}): Promise<ChatStreamResult> {
  const org = await resolveOrgByToken(params.orgToken)
  if (!org) throw new Error('Invalid org token')

  const conversationId = await getOrCreateConversation(
    params.conversationId,
    org.id,
    params.visitorId,
  )

  // Retrieve chunks and history concurrently — neither depends on the other.
  const [relevantChunks, history] = await Promise.all([
    retrieveRelevantChunks(params.message, org.id),
    getConversationHistory(conversationId),
  ])

  const systemPrompt = buildSystemPrompt(org, relevantChunks.map(c => c.content))

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: params.message },
  ]

  const streamResponse = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    stream: true,
  })

  let fullResponse = ''

  /**
   * Generator that reads chunks from the DeepSeek/OpenAI streaming response,
   * yields each token, and persists messages when the stream signals `stop`.
   */
  const tokenStream = async function* (): AsyncGenerator<string> {
    for await (const chunk of streamResponse) {
      const token = chunk.choices[0]?.delta?.content ?? ''
      if (token) {
        fullResponse += token
        yield token
      }
      if (chunk.choices[0]?.finish_reason === 'stop') {
        // Persist the complete exchange once streaming is finished.
        const wasAnswered = !fullResponse.includes(FALLBACK_PHRASE)
        await saveMessages(conversationId, org.id, params.message, fullResponse, wasAnswered)
        return
      }
    }
  }

  return { conversationId, stream: tokenStream() }
}
