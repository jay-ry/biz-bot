import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  slug:           text('slug').unique().notNull(),
  publicToken:    text('public_token').unique().notNull(),
  botName:        text('bot_name').default('Assistant'),
  brandColor:     text('brand_color').default('#6366f1'),
  systemPrompt:   text('system_prompt'),
  allowedOrigins: text('allowed_origins').array(),
  createdAt:      timestamp('created_at').defaultNow(),
})
