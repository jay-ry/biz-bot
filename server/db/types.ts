import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  organizations,
  users,
  documents,
  chunks,
  conversations,
  messages,
} from './schema'

export type Organization    = InferSelectModel<typeof organizations>
export type NewOrganization = InferInsertModel<typeof organizations>

export type User    = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Document    = InferSelectModel<typeof documents>
export type NewDocument = InferInsertModel<typeof documents>

export type Chunk    = InferSelectModel<typeof chunks>
export type NewChunk = InferInsertModel<typeof chunks>

export type Conversation    = InferSelectModel<typeof conversations>
export type NewConversation = InferInsertModel<typeof conversations>

export type Message    = InferSelectModel<typeof messages>
export type NewMessage = InferInsertModel<typeof messages>
