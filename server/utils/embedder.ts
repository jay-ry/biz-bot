/**
 * Embedding utilities backed by Ollama's nomic-embed-text model (768-dim).
 *
 * Uses Ollama's /api/embed endpoint which accepts batched inputs and returns
 * all vectors in a single response. No SDK required — plain fetch.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const EMBED_MODEL = 'nomic-embed-text'
export const EMBED_DIM = 768
const BATCH_SIZE = 50

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: batch }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Ollama embed request failed (${res.status}): ${body}`)
    }

    const data = await res.json() as { embeddings: number[][] }
    if (!Array.isArray(data.embeddings)) {
      throw new Error(`Unexpected Ollama response shape: ${JSON.stringify(data)}`)
    }
    embeddings.push(...data.embeddings)
  }

  return embeddings
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text])
  return embedding
}
