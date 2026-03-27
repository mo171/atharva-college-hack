-- Migration: Add content_hash column to narrative_chunks table
-- Purpose: Enable deduplication of narrative chunks to prevent duplicate content
-- Date: 2024-01-15

-- Add content_hash column to narrative_chunks
ALTER TABLE narrative_chunks ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index on (project_id, content_hash) for efficient duplicate checking
CREATE INDEX IF NOT EXISTS idx_narrative_chunks_content_hash 
ON narrative_chunks(project_id, content_hash);

-- Add comment to document the column purpose
COMMENT ON COLUMN narrative_chunks.content_hash IS 
'SHA-256 hash (first 16 chars) of content for deduplication';
