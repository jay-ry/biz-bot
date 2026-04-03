/**
 * Retrieval service for RAG (Retrieval-Augmented Generation).
 *
 * Performs vector similarity search against the `chunks` table using pgvector's
 * cosine distance operator (<=>). Only chunks belonging to the specified org
 * and meeting the similarity threshold are returned.
 */

import { db } from '../db/connection'
import { sql } from 'drizzle-orm'
import { embedQuery } from '../utils/embedder'

export interface RetrievedChunk {
  id: string
  content: string
  similarity: number
}

/** Minimum cosine similarity score to include a chunk in results (0–1 scale). */
const SIMILARITY_THRESHOLD = 0.70
/** Maximum number of chunks to return per query. */
const TOP_K = 5

/**
 * Embeds `query` and returns the most similar chunks from the org's knowledge base.
 *
 * @param query     - The user's natural-language question.
 * @param orgId     - UUID of the organisation whose chunks to search.
 * @param topK      - Maximum number of results to return (default: 5).
 * @param threshold - Minimum similarity score to include a result (default: 0.70).
 * @returns Array of matching chunks ordered by descending similarity.
 */
export async function retrieveRelevantChunks(
  query: string,
  orgId: string,
  topK = TOP_K,
  threshold = SIMILARITY_THRESHOLD,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query)
  const vectorLiteral = `[${queryEmbedding.join(',')}]`

  const rows = await db.execute(sql`
    SELECT
      id,
      content,
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM chunks
    WHERE org_id = ${orgId}::uuid
      AND 1 - (embedding <=> ${vectorLiteral}::vector) >= ${threshold}
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `)

  return (rows.rows as Array<{ id: string; content: string; similarity: string }>).map(row => ({
    id: row.id,
    content: row.content,
    similarity: parseFloat(row.similarity),
  }))
}
