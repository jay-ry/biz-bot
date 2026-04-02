import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  orgId:        uuid('org_id').references(() => organizations.id),
  email:        text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role:         text('role').default('owner'),
  createdAt:    timestamp('created_at').defaultNow(),
})
