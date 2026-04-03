-- Phase 2.5: Resize embedding column from 1536 to 768 dimensions
-- Switching from OpenAI text-embedding-3-small (1536-dim) to Ollama nomic-embed-text (768-dim).
-- WARNING: This migration wipes all existing chunk rows.

-- 1. Drop the ivfflat index (cannot ALTER column type with an active index)
DROP INDEX IF EXISTS embedding_idx;

-- 2. Delete all existing chunk rows — wrong dimension, incompatible with new vectors
DELETE FROM chunks;

-- 3. Alter the column type to 768 dimensions
ALTER TABLE chunks
  ALTER COLUMN embedding TYPE vector(768);

-- 4. Recreate the ivfflat index for cosine similarity search
CREATE INDEX embedding_idx
  ON chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
