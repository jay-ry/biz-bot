import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { documents } from './documents'

export const chunks = pgTable('chunks', {
  id:         uuid('id').primaryKey().defaultRandom(),
  orgId:      uuid('org_id').references(() => organizations.id).notNull(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  content:    text('content').notNull(),
  tokenCount: integer('token_count'),
  embedding:  vector('embedding', { dimensions: 1536 }),
  createdAt:  timestamp('created_at').defaultNow(),
}, (table) => ({
  embeddingIdx: index('embedding_idx').using('ivfflat', table.embedding.op('vector_cosine_ops')),
}))
