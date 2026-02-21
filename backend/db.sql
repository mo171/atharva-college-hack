CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. PROJECTS: The parent container
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    writing_type TEXT, -- novel, script, research
    tone_intention TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENTITIES: The 'Knowledge Base' for characters and locations
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('CHARACTER', 'LOCATION', 'OBJECT')),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores: {"status": "alive", "current_loc": "Paris"}
    is_initial_setup BOOLEAN DEFAULT FALSE, -- Track if added during "Story Memory Setup"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NARRATIVE_CHUNKS: The 'Vector Memory' for RAG
CREATE TABLE narrative_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Vector size for OpenAI 'text-embedding-3-small'
    chunk_index SERIAL, -- To keep the story sequence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- 4. RELATIONSHIPS: For the visual Relationship Graph
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    entity_a_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    entity_b_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    relation_type TEXT, -- 'friend', 'enemy', 'sibling'
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONSISTENCY_LOGS: Feeds the Insight Panel (Right Side)
CREATE TABLE consistency_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    issue_type TEXT, -- 'INCONSISTENCY', 'POV_SHIFT', 'TONE_CLASH'
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    original_text TEXT,
    explanation TEXT, -- GPT-generated reason
    suggested_fix TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'IGNORED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- A specialized function to perform similarity search
CREATE OR REPLACE FUNCTION match_narrative_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    narrative_chunks.id,
    narrative_chunks.content,
    1 - (narrative_chunks.embedding <=> query_embedding) AS similarity
  FROM narrative_chunks
  WHERE narrative_chunks.project_id = p_project_id
    AND 1 - (narrative_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

ALTER TABLE projects ADD COLUMN target_pov TEXT; -- 'First Person', 'Third Person', etc.

ALTER TABLE consistency_logs ADD COLUMN involved_entity_ids UUID[]; -- Array of Entity IDs