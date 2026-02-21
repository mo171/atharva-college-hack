# Repository Structure and Database Analysis

## High-Level Project Structure

- `frontend/`: Next.js application (App Router) for authentication, project setup, and editor UI.
- `backend/`: FastAPI backend for project initialization, NLP analysis, knowledge graph updates, and websocket/editor endpoints.

## Directory Map

```text
.
├── backend/
│   ├── app/
│   │   ├── app.py
│   │   ├── config.py
│   │   ├── lib/
│   │   │   ├── supabase.py
│   │   │   └── vector_store.py
│   │   ├── routes/
│   │   │   ├── editor.py
│   │   │   ├── project.py
│   │   │   └── ws_editor.py
│   │   └── services/
│   │       ├── analysis.py
│   │       ├── character_summary.py
│   │       ├── extraction.py
│   │       ├── llm_gateway.py
│   │       └── project_setup.py
│   ├── db.sql
│   ├── requirements.txt
│   └── smoke_test.py
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   ├── landing/
│   │   │   ├── new-project/
│   │   │   ├── providers/
│   │   │   ├── studio/
│   │   │   └── ui/
│   │   ├── editor/
│   │   ├── new-project/
│   │   └── start-writing/
│   ├── features/editor/
│   ├── lib/
│   │   ├── api.js
│   │   ├── axios.js
│   │   ├── editorSocket.js
│   │   └── supabase.js
│   ├── public/
│   ├── store/
│   └── package.json
└── REPO_ANALYSIS.md
```

## How Data Flows Through the System

1. Frontend creates projects and submits writing through API wrappers in `frontend/lib/api.js`.
2. FastAPI routes under `backend/app/routes/` receive requests.
3. Services in `backend/app/services/` perform:
   - project setup and initial inserts,
   - NLP extraction,
   - knowledge graph consistency checks,
   - LLM-generated insight and summary updates.
4. Supabase/Postgres stores canonical records for projects, entities, chunks, relationships, and consistency logs.

## Database Schema Analysis (`backend/db.sql`)

### Extensions

- `uuid-ossp` for UUID primary key generation.
- `vector` for pgvector embeddings.

### Core Tables

1. `projects`
   - Purpose: top-level workspace per story.
   - Key columns: `id`, `user_id`, `title`, `genre`, `writing_type`, `tone_intention`, `target_pov`, timestamps.

2. `entities`
   - Purpose: story knowledge objects (characters/locations/objects).
   - Key columns: `project_id`, `name`, `entity_type`, `description`, `metadata JSONB`, `is_initial_setup`.
   - Uses `ON DELETE CASCADE` to clean child records when project is removed.

3. `narrative_chunks`
   - Purpose: ordered story content fragments for retrieval and timeline.
   - Key columns: `content`, `embedding VECTOR(1536)`, `chunk_index`.
   - Embedding size aligns with OpenAI `text-embedding-3-small`.

4. `relationships`
   - Purpose: directed graph edges between entities.
   - Key columns: `entity_a_id`, `entity_b_id`, `relation_type`, `description`.

5. `consistency_logs`
   - Purpose: detected continuity issues and resolutions.
   - Key columns: `issue_type`, `severity`, `original_text`, `explanation`, `suggested_fix`, `status`, `involved_entity_ids`.

### Database Function

- `match_narrative_chunks(query_embedding, match_threshold, match_count, p_project_id)`
  - Returns semantically similar chunks using cosine distance (`<=>`) transformed to similarity.
  - Filters by `project_id`, threshold, and row limit.

## Runtime Usage of Database Objects

- `project_setup.py`
  - Inserts into `projects`, seeds `entities`, inserts initial `narrative_chunks` record.

- `extraction.py`
  - Upserts/creates `entities` and appends `narrative_chunks` with incremented `chunk_index`.

- `analysis.py`
  - Loads/syncs graph from `entities` + `relationships`.
  - Inserts `relationships` for new facts.
  - Inserts `consistency_logs` when contradictions are detected.

- `llm_gateway.py`
  - Reads pending `consistency_logs` and updates `suggested_fix` with short alerts.

- `character_summary.py`
  - Reads `relationships`, `entities`, and calls RPC `match_narrative_chunks`.
  - Writes generated persona/story summaries back into `entities.metadata`.

## Observations and Recommendations

1. **Missing uniqueness constraints may allow duplicates**
   - Consider unique index on `(project_id, name)` for `entities`.
   - Consider unique index on `(project_id, entity_a_id, entity_b_id, relation_type)` for `relationships`.

2. **`chunk_index SERIAL` is globally incremented, but app expects per-project order**
   - Code computes next index per project manually; schema could use plain `INT` and enforce unique `(project_id, chunk_index)`.

3. **Performance indexing opportunities**
   - Add indexes on frequent filters:
     - `entities(project_id, entity_type, name)`
     - `narrative_chunks(project_id, created_at)`
     - `consistency_logs(project_id, status, issue_type)`
     - `relationships(project_id, entity_a_id, entity_b_id)`

4. **Vector search readiness**
   - If dataset grows, add pgvector ANN index (`ivfflat`/`hnsw`) on `narrative_chunks.embedding`.

5. **Operational safety**
   - The schema currently has no row-level security policies in this SQL file. If Supabase is directly exposed to clients, enforce RLS by `user_id` / project ownership.

