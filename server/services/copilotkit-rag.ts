/**
 * CopilotKit RAG service adapter.
 *
 * Wires our DeepSeek-backed RAG retrieval pipeline into the CopilotKit runtime
 * as a custom `CopilotServiceAdapter`. This allows the CopilotKit frontend SDK
 * to communicate with the backend via the standard CopilotKit GraphQL protocol
 * while still using our own vector-search context injection.
 *
 * The adapter:
 *  1. Extracts the last user message from the incoming CopilotKit message array.
 *  2. Retrieves relevant knowledge-base chunks for that message.
 *  3. Prepends a system prompt (with injected context) to the DeepSeek request.
 *  4. Streams DeepSeek's response back through the CopilotKit event stream via
 *     the OpenAI-compatible SDK.
 */

import OpenAI from 'openai'
import {
  CopilotRuntime,
  type CopilotServiceAdapter,
  type CopilotRuntimeChatCompletionRequest,
  type CopilotRuntimeChatCompletionResponse,
} from '@copilotkit/runtime'
import { randomUUID } from '@copilotkit/shared'

/**
 * Minimal local interface mirroring the `TextMessage` subclass from
 * `@copilotkit/runtime`. `TextMessage` is not re-exported from the package
 * barrel so we replicate the fields we actually use to keep types sound.
 */
interface TextMessageLike {
  role: string
  content: string
}
import { retrieveRelevantChunks } from './retrieval.service'

const CHAT_MODEL = 'deepseek-chat'
const FALLBACK_PHRASE = "I'm not sure about that — please contact us directly."

/** Shared OpenAI-compatible client pointing at the DeepSeek API. */
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

/**
 * A CopilotKit service adapter that routes inference through DeepSeek
 * and injects RAG context scoped to the given organisation.
 */
class DeepSeekRagAdapter implements CopilotServiceAdapter {
  public readonly provider = 'deepseek'
  public readonly model: string

  private readonly orgId: string
  private readonly systemPromptBase: string

  constructor(orgId: string, systemPromptBase: string, model = CHAT_MODEL) {
    this.orgId = orgId
    this.systemPromptBase = systemPromptBase
    this.model = model
  }

  /**
   * Processes a CopilotKit chat completion request.
   *
   * Retrieves RAG context for the latest user message, builds a DeepSeek
   * messages array, and streams tokens back through the CopilotKit event source.
   *
   * @param request - The incoming CopilotKit chat completion request.
   * @returns `{ threadId }` as required by `CopilotRuntimeChatCompletionResponse`.
   */
  async process(
    request: CopilotRuntimeChatCompletionRequest,
  ): Promise<CopilotRuntimeChatCompletionResponse> {
    const { messages, eventSource, threadId } = request

    // Extract the last user text message to use as the retrieval query.
    // `isTextMessage()` is a type guard that narrows Message → TextMessage;
    // we cast through `unknown` to our local interface to access typed fields.
    const lastUserMsg = ([...messages]
      .reverse()
      .find(m => m.isTextMessage() && (m as unknown as TextMessageLike).role === 'user')) as unknown as TextMessageLike | undefined

    const userText: string = lastUserMsg?.content ?? ''

    // Retrieve relevant chunks for the user's query.
    let contextText = 'No relevant context found.'
    if (userText) {
      const chunks = await retrieveRelevantChunks(userText, this.orgId)
      if (chunks.length > 0) {
        contextText = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
      }
    }

    const systemPrompt = [
      this.systemPromptBase,
      `If you cannot find the answer in the context, respond with: "${FALLBACK_PHRASE}"`,
      '\n--- Context ---',
      contextText,
    ].join('\n')

    // Build messages array: only pass text messages (skip tool calls etc.).
    // Cast via `unknown` because TypeScript cannot narrow array elements after
    // a `.filter()` using a method-based type guard; the guard runs at runtime.
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter(m => m.isTextMessage())
        .map(m => {
          const tm = m as unknown as TextMessageLike
          return { role: tm.role, content: tm.content }
        }),
    ]

    const abortSignal = request.signal as AbortSignal | undefined

    const streamResponse = await client.chat.completions.create({
      model: this.model,
      messages: ollamaMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: true,
      ...(abortSignal ? { signal: abortSignal } : {}),
    })

    const messageId = randomUUID()

    // Stream tokens through the CopilotKit event stream.
    await eventSource.stream(async (eventStream$) => {
      eventStream$.sendTextMessageStart({ messageId })

      for await (const chunk of streamResponse) {
        const token = chunk.choices[0]?.delta?.content ?? ''
        if (token) {
          eventStream$.sendTextMessageContent({ messageId, content: token })
        }
      }

      eventStream$.sendTextMessageEnd({ messageId })
      eventStream$.complete()
    })

    return { threadId: threadId ?? randomUUID() }
  }
}

/**
 * Builds a `CopilotRuntime` instance pre-wired with the DeepSeek RAG adapter
 * scoped to the given organisation and system prompt.
 *
 * @param orgId            - UUID of the organisation whose chunks to search.
 * @param systemPromptBase - Base system prompt (without context injection).
 * @returns A configured `CopilotRuntime` ready to handle a request.
 */
export function buildCopilotRuntime(orgId: string, systemPromptBase: string): CopilotRuntime {
  const serviceAdapter = new DeepSeekRagAdapter(orgId, systemPromptBase)
  // CopilotRuntime itself does not take serviceAdapter in the constructor —
  // the adapter is passed to the endpoint factory (copilotRuntimeNodeHttpEndpoint).
  // We attach it as a property so the route can access it.
  const runtime = new CopilotRuntime()
  // Attach the adapter to the runtime instance for use in the route handler.
  ;(runtime as CopilotRuntime & { _serviceAdapter: CopilotServiceAdapter })._serviceAdapter = serviceAdapter
  return runtime
}

/**
 * Returns the RAG service adapter from a runtime instance built by
 * `buildCopilotRuntime`. This avoids exposing the internal attachment pattern
 * beyond this module.
 *
 * @param runtime - A runtime instance created by `buildCopilotRuntime`.
 * @returns The attached `CopilotServiceAdapter`.
 */
export function getServiceAdapter(runtime: CopilotRuntime): CopilotServiceAdapter {
  return (runtime as CopilotRuntime & { _serviceAdapter: CopilotServiceAdapter })._serviceAdapter
}
