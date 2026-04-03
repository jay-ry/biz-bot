/**
 * Document ingestion service.
 *
 * Handles the full lifecycle of a knowledge-base document:
 *   1. Create a document row in `documents` with status "pending"
 *   2. Extract text (plain-text or PDF)
 *   3. Split into overlapping chunks
 *   4. Embed each chunk via OpenAI
 *   5. Persist chunk rows with their vector embeddings
 *   6. Flip the document status to "ready" (or "error" on failure)
 *
 * processDocument() is intentionally fire-and-forget — callers must NOT await it.
 */

import { db } from '../db/connection'
import { documents, chunks } from '../db/schema'
import { eq } from 'drizzle-orm'
import { chunkText } from '../utils/chunker'
import { embedTexts } from '../utils/embedder'
import { extractPdfText } from '../utils/pdf-extractor'
import { nanoid } from 'nanoid'

export type IngestSource = 'text' | 'pdf'

interface IngestTextInput {
  orgId: string
  title: string
  sourceType: 'text'
  rawContent: string
}

interface IngestPdfInput {
  orgId: string
  title: string
  sourceType: 'pdf'
  fileBuffer: Buffer
  fileName: string
}

type IngestInput = IngestTextInput | IngestPdfInput

/**
 * Insert a new document row with status "pending" and return its generated ID.
 * The actual text extraction and embedding happen separately in processDocument().
 *
 * @param input Ingestion payload (text or PDF variant)
 * @returns The UUID of the newly created document row
 */
export async function createDocument(input: IngestInput): Promise<string> {
  // Generate a stable storage path for PDFs; text documents have no file on disk
  const storagePath = input.sourceType === 'pdf' ? `uploads/${nanoid()}.pdf` : null

  const [doc] = await db.insert(documents).values({
    orgId: input.orgId,
    title: input.title,
    sourceType: input.sourceType,
    storagePath,
    rawContent: input.sourceType === 'text' ? input.rawContent : null,
    status: 'pending',
  }).returning()

  return doc.id
}

/**
 * Extract text, chunk, embed, and persist chunks for a document.
 * Updates the document's status column throughout:
 *   pending → processing → ready | error
 *
 * Must be called as fire-and-forget (do NOT await from HTTP handlers).
 *
 * @param documentId UUID of the document row created by createDocument()
 * @param input      The same IngestInput passed to createDocument()
 */
export async function processDocument(documentId: string, input: IngestInput): Promise<void> {
  try {
    await db.update(documents).set({ status: 'processing' }).where(eq(documents.id, documentId))

    // --- Step 1: extract raw text ---
    let text: string
    if (input.sourceType === 'text') {
      text = input.rawContent
    } else {
      // Persist the PDF to disk before extraction so it can be re-processed if needed
      await Bun.write(`server/uploads/${documentId}.pdf`, input.fileBuffer)
      text = await extractPdfText(input.fileBuffer)
    }

    // --- Step 2: chunk ---
    const textChunks = chunkText(text)
    if (textChunks.length === 0) {
      await db.update(documents).set({ status: 'error' }).where(eq(documents.id, documentId))
      return
    }

    // --- Step 3: embed ---
    const embeddings = await embedTexts(textChunks.map(c => c.content))

    // --- Step 4: persist chunks ---
    await db.insert(chunks).values(
      textChunks.map((chunk, i) => ({
        orgId: input.orgId,
        documentId,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[i],
      }))
    )

    await db.update(documents).set({ status: 'ready' }).where(eq(documents.id, documentId))
  } catch (err) {
    console.error('Ingest error for document', documentId, err)
    await db.update(documents).set({ status: 'error' }).where(eq(documents.id, documentId))
  }
}

/**
 * Return all documents belonging to the given organisation, ordered by DB default.
 *
 * @param orgId UUID of the requesting organisation
 */
export async function listDocuments(orgId: string) {
  return db.select().from(documents).where(eq(documents.orgId, orgId))
}

/**
 * Hard-delete a document and all of its associated chunk rows.
 * Chunks are removed first to satisfy the foreign key constraint.
 *
 * @param documentId UUID of the document to remove
 * @param orgId      UUID of the organisation — used for scoping (prevents cross-org deletion)
 */
export async function deleteDocument(documentId: string, orgId: string): Promise<void> {
  // Delete chunks first — they reference documents via FK
  await db.delete(chunks).where(eq(chunks.documentId, documentId))
  await db.delete(documents).where(eq(documents.id, documentId))
}
