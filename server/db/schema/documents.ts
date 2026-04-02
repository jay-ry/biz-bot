import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const documents = pgTable('documents', {
  id:          uuid('id').primaryKey().defaultRandom(),
  orgId:       uuid('org_id').references(() => organizations.id).notNull(),
  title:       text('title').notNull(),
  sourceType:  text('source_type').notNull(),
  storagePath: text('storage_path'),
  rawContent:  text('raw_content'),
  status:      text('status').default('pending'),
  createdAt:   timestamp('created_at').defaultNow(),
})
