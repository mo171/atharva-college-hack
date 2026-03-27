-- Migration: Update match_narrative_chunks function to include chunk_index
-- Purpose: Return chunk_index along with content and similarity for better context
-- Date: 2024-01-15

-- Drop the existing function
DROP FUNCTION IF EXISTS match_narrative_chunks(VECTOR(1536), FLOAT, INT, UUID);

-- Recreate with chunk_index in the return
CREATE OR REPLACE FUNCTION match_narrative_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  chunk_index INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    narrative_chunks.id,
    narrative_chunks.content,
    1 - (narrative_chunks.embedding <=> query_embedding) AS similarity,
    narrative_chunks.chunk_index
  FROM narrative_chunks
  WHERE narrative_chunks.project_id = p_project_id
    AND 1 - (narrative_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
