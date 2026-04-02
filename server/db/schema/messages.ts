import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { conversations } from './conversations'

export const messages = pgTable('messages', {
  id:             uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  orgId:          uuid('org_id').references(() => organizations.id).notNull(),
  role:           text('role').notNull(),
  content:        text('content').notNull(),
  wasAnswered:    boolean('was_answered').default(true),
  createdAt:      timestamp('created_at').defaultNow(),
})
