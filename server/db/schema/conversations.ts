import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const conversations = pgTable('conversations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  orgId:     uuid('org_id').references(() => organizations.id).notNull(),
  visitorId: text('visitor_id'),
  startedAt: timestamp('started_at').defaultNow(),
})
