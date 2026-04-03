/**
 * Ingest controller — thin HTTP handlers for document ingestion endpoints.
 *
 * All business logic lives in ingest.service.ts.
 * Handlers here only: parse + validate input, call service, return response.
 */

import type { Context } from 'hono'
import {
  createDocument,
  processDocument,
  listDocuments,
  deleteDocument,
} from '../services/ingest.service'
import { z } from 'zod'

/** Zod schema for plain-text ingestion requests. */
const textSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
})

/**
 * POST /api/ingest/text
 * Ingest a plain-text knowledge-base document.
 * processDocument() is intentionally NOT awaited — it runs in the background.
 *
 * @param c Hono context (user must be set by authMiddleware)
 * @returns 201 JSON with the new document id and initial status "pending"
 */
export async function handleIngestText(c: Context): Promise<Response> {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)

  const parsed = textSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const docId = await createDocument({
    orgId: user.orgId,
    title: parsed.data.title,
    sourceType: 'text',
    rawContent: parsed.data.content,
  })

  // Fire-and-forget: respond immediately; processing happens asynchronously
  processDocument(docId, {
    orgId: user.orgId,
    title: parsed.data.title,
    sourceType: 'text',
    rawContent: parsed.data.content,
  })

  return c.json({ id: docId, status: 'pending' }, 201)
}

/**
 * POST /api/ingest/pdf
 * Ingest a PDF file as a knowledge-base document.
 * Accepts multipart/form-data with fields: file (PDF, max 10 MB) and title (string).
 * processDocument() is intentionally NOT awaited — it runs in the background.
 *
 * @param c Hono context (user must be set by authMiddleware)
 * @returns 201 JSON with the new document id and initial status "pending"
 */
export async function handleIngestPdf(c: Context): Promise<Response> {
  const user = c.get('user')
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null

  if (!file || !title) return c.json({ error: 'file and title are required' }, 400)
  if (file.type !== 'application/pdf') return c.json({ error: 'Only PDF files accepted' }, 400)
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'File too large (max 10 MB)' }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())

  const docId = await createDocument({
    orgId: user.orgId,
    title,
    sourceType: 'pdf',
    fileBuffer: buffer,
    fileName: file.name,
  })

  // Fire-and-forget: respond immediately; processing happens asynchronously
  processDocument(docId, {
    orgId: user.orgId,
    title,
    sourceType: 'pdf',
    fileBuffer: buffer,
    fileName: file.name,
  })

  return c.json({ id: docId, status: 'pending' }, 201)
}

/**
 * GET /api/ingest/
 * List all documents for the authenticated organisation.
 *
 * @param c Hono context (user must be set by authMiddleware)
 * @returns 200 JSON array of document rows
 */
export async function handleListDocuments(c: Context): Promise<Response> {
  const user = c.get('user')
  const docs = await listDocuments(user.orgId)
  return c.json(docs)
}

/**
 * DELETE /api/ingest/:id
 * Delete a document and all its chunks by ID.
 *
 * @param c Hono context (user must be set by authMiddleware)
 * @returns 200 JSON { ok: true }
 */
export async function handleDeleteDocument(c: Context): Promise<Response> {
  const user = c.get('user')
  const { id } = c.req.param()
  await deleteDocument(id, user.orgId)
  return c.json({ ok: true })
}
