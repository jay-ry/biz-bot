/**
 * Ingest routes — document knowledge-base ingestion endpoints.
 *
 * All routes require a valid JWT (authMiddleware).
 * Mounted at /api/ingest in server/index.ts.
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import {
  handleIngestText,
  handleIngestPdf,
  handleListDocuments,
  handleDeleteDocument,
} from '../controller/ingest.controller'

const ingest = new Hono()

// Require authentication on every route in this sub-app
ingest.use('*', authMiddleware)

ingest.get('/', handleListDocuments)
ingest.post('/text', handleIngestText)
ingest.post('/pdf', handleIngestPdf)
ingest.delete('/:id', handleDeleteDocument)

export default ingest
