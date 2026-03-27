# Design Document: Architecture Improvements & Feature Activation

## Overview

This design implements critical performance optimizations and feature activations for the AI-powered fiction writing assistant. The system currently has powerful capabilities (RAG, knowledge graph, style analysis) that are either underutilized or causing performance bottlenecks. This design addresses these issues through caching, semantic retrieval, real-time communication, and intelligent batching.

The design follows a layered approach:
1. **Infrastructure Layer**: Caching, WebSocket management
2. **Service Layer**: Enhanced RAG, optimized character summaries, unified save flow
3. **Integration Layer**: POV/tone injection, style blueprint activation
4. **Validation Layer**: Pydantic models for robust data handling

## Architecture

### Current Architecture Issues

1. **Knowledge Graph Rebuilt on Every Request**: `StoryKnowledgeGraph.from_supabase()` loads all entities and relationships on every analysis (N+2 queries)
2. **Sequential History Only**: Ghost text uses last 3 chunks instead of semantically relevant scenes
3. **HTTP Polling**: Frontend uses HTTP requests instead of existing WebSocket endpoint
4. **Orphaned Metadata**: `target_pov`, `tone_intention`, and `style_blueprint` stored but not used
5. **Expensive Character Summaries**: Runs for every character on every analysis (15+ API calls for 5 characters)
6. **Fragile JSON Parsing**: Plot extraction has no schema validation

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────┐         ┌─────────────────┐              │
│  │ EditorSocket │◄────────┤ EditorContainer │              │
│  │ (WebSocket)  │         │  (React)        │              │
│  └──────┬───────┘         └─────────────────┘              │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │ WebSocket /ws/editor
          │
┌─────────▼────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WebSocket Handler                        │   │
│  │  - Connection management                              │   │
│  │  - Ping/pong keepalive                               │   │
│  │  - Message routing                                    │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │         Analysis Orchestrator                         │   │
│  │  - Unified save/analyze flow                          │   │
│  │  - Lightweight vs full analysis                       │   │
│  │  - Background task management                         │   │
│  └──────┬────────────────────────────┬──────────────────┘   │
│         │                            │                       │
│  ┌──────▼──────────┐        ┌───────▼──────────┐           │
│  │  KG Cache Layer │        │  RAG Service     │           │
│  │  - TTL: 5 min   │        │  - Vector search │           │
│  │  - LRU: 100     │        │  - Semantic      │           │
│  │  - Thread-safe  │        │    retrieval     │           │
│  └──────┬──────────┘        └───────┬──────────┘           │
│         │                            │                       │
│  ┌──────▼────────────────────────────▼──────────────────┐   │
│  │           Core Services                               │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │ Extraction  │  │  Suggestion  │  │  Character  │ │   │
│  │  │  (spaCy)    │  │  (Enhanced)  │  │  Summary    │ │   │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │   Style     │  │     Plot     │  │  Correction │ │   │
│  │  │  Blueprint  │  │  Extraction  │  │             │ │   │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase (PostgreSQL + pgvector)        │   │
│  │  - projects (style_blueprint, target_pov, tone)      │   │
│  │  - entities (metadata with last_summary_update)      │   │
│  │  - narrative_chunks (content, embedding, hash)       │   │
│  │  - relationships (KG edges)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. KG Cache Service (`backend/app/services/kg_cache.py`)

**Purpose**: In-memory cache for Knowledge Graph instances to avoid repeated DB queries.

**Interface**:
```python
class KGCache:
    def get(self, project_id: str) -> StoryKnowledgeGraph | None
    def set(self, project_id: str, kg: StoryKnowledgeGraph) -> None
    def invalidate(self, project_id: str) -> None
    def update_fact(self, project_id: str, subject: str, relation: str, obj: str) -> None
```

**Implementation Details**:
- Uses `cachetools.TTLCache` with 5-minute TTL
- LRU eviction policy with max 100 entries
- Thread-safe with `threading.RLock`
- Lazy loading: cache miss triggers `StoryKnowledgeGraph.from_supabase()`
- Write-through: updates both cache and database

### 2. Enhanced RAG Service (`backend/app/services/rag.py`)

**Purpose**: Semantic retrieval of narrative chunks for context-aware suggestions.

**Interface**:
```python
class RAGService:
    def retrieve_relevant_chunks(
        self,
        project_id: str,
        query_text: str,
        top_k: int = 3,
        threshold: float = 0.3
    ) -> list[dict]
    
    def retrieve_for_character(
        self,
        project_id: str,
        character_name: str,
        top_k: int = 10
    ) -> list[dict]
```

**Implementation Details**:
- Generates query embedding using `get_embedding()`
- Calls `match_narrative_chunks()` SQL function
- Filters by similarity threshold (default 0.3)
- Returns chunks with content, similarity score, and chunk_index
- Falls back to sequential chunks if no semantic matches

### 3. Enhanced Suggestion Service (`backend/app/services/suggestion.py`)

**Purpose**: Generate ghost text with RAG, POV, and tone awareness.

**Modified Interface**:
```python
class SuggestionService:
    def get_ghost_suggestion(
        self,
        context_text: str,
        project_id: str,  # NEW: for fetching project metadata
        blueprint: dict,
        history: list[str] = None,
        graph_facts: list[str] = None,
        relevant_scenes: list[str] = None,  # NEW: from RAG
    ) -> str
```

**System Prompt Enhancement**:
```python
# Fetch from projects table
target_pov = project.get("target_pov", "Third Person")
tone_intention = project.get("tone_intention", "Balanced")

# Add to system prompt
f"- POV: {target_pov} (CRITICAL: Maintain this perspective consistently)\n"
f"- Tone: {tone_intention}\n"

# Add relevant scenes section
if relevant_scenes:
    memory_block += (
        "RELEVANT PAST SCENES (from story memory):\n"
        + "\n".join([f"- {scene}" for scene in relevant_scenes])
        + "\n\n"
    )
```

### 4. WebSocket Manager (`backend/app/lib/websocket_manager.py`)

**Purpose**: Manage WebSocket connections with keepalive and reconnection.

**Interface**:
```python
class WebSocketManager:
    async def handle_connection(self, websocket: WebSocket) -> None
    async def send_analysis(self, websocket: WebSocket, payload: dict) -> None
    async def send_error(self, websocket: WebSocket, error: str) -> None
    async def keepalive_loop(self, websocket: WebSocket) -> None
```

**Implementation Details**:
- Accepts connection and starts keepalive task
- Sends ping every 30 seconds, expects pong within 10 seconds
- Routes messages by type: "analyze", "ping", "save"
- Handles disconnection gracefully with cleanup
- Logs connection events for monitoring

### 5. Analysis Orchestrator (`backend/app/services/analysis_orchestrator.py`)

**Purpose**: Unified flow for save and analysis with intelligent batching.

**Interface**:
```python
class AnalysisOrchestrator:
    async def process_content(
        self,
        project_id: str,
        content: str,
        mode: Literal["auto_save", "manual_analyze"]
    ) -> dict
    
    async def _run_lightweight_analysis(self, project_id: str, content: str) -> dict
    async def _run_full_analysis(self, project_id: str, content: str) -> dict
    async def _batch_character_summaries(self, project_id: str, character_ids: list[str]) -> None
```

**Flow Logic**:
```
auto_save mode:
  1. Check content hash (skip if duplicate)
  2. Generate embedding
  3. Save narrative chunk
  4. Extract entities (NER only, no triples)
  5. Upsert entities to DB
  6. Return lightweight response

manual_analyze mode:
  1. Run full extraction (NER + SVO triples)
  2. Update KG cache (write-through)
  3. Detect inconsistencies
  4. Generate alerts
  5. Batch character summaries (background task)
  6. Return full analysis response
```

### 6. Optimized Character Summary Service

**Modified Interface**:
```python
def should_update_summary(entity_metadata: dict) -> bool:
    """Check if summary needs update (10-minute throttle)."""
    last_update = entity_metadata.get("last_summary_update")
    if not last_update:
        return True
    delta = datetime.now(timezone.utc) - datetime.fromisoformat(last_update)
    return delta.total_seconds() > 600  # 10 minutes

async def batch_update_character_summaries(
    project_id: str,
    character_ids: list[str],
    max_updates: int = 3
) -> list[dict]:
    """Update summaries for top N characters by mention frequency."""
    # Filter by should_update_summary
    # Sort by mention count (from current analysis)
    # Take top max_updates
    # Run updates in parallel with asyncio.gather
```

### 7. Style Blueprint Service (`backend/app/services/style_blueprint.py`)

**Purpose**: Auto-generate style blueprint from initial content.

**Interface**:
```python
class StyleBlueprintService:
    def should_generate_blueprint(self, project_id: str) -> bool
    async def generate_from_setup(self, project_id: str, setup_text: str) -> dict
    async def generate_from_chunks(self, project_id: str) -> dict
    def get_blueprint(self, project_id: str) -> dict
```

**Generation Triggers**:
1. During project setup if `world_setting` > 500 chars OR total character descriptions > 300 chars
2. After first 1000 words written (tracked by narrative_chunks word count)
3. Manual regeneration via `/projects/{id}/regenerate-blueprint`

### 8. Plot Extraction with Validation

**Pydantic Models**:
```python
from pydantic import BaseModel, Field, validator

class PlotPointData(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=500)
    event_type: Literal["ACTION", "DIALOGUE", "DISCOVERY", "CONFLICT", "RESOLUTION", "TRANSITION", "OTHER"]
    timeline_position: int = Field(..., ge=1)
    chunk_index: int = Field(..., ge=0)
    characters: list[str] = Field(default_factory=list)
    follows: list[int] = Field(default_factory=list)
    causes: list[int] = Field(default_factory=list)
    
    @validator("characters")
    def validate_characters(cls, v):
        return [c.strip() for c in v if c.strip()]

class PlotExtractionResponse(BaseModel):
    plot_points: list[PlotPointData]
```

**Modified Extraction Flow**:
```python
# Add example JSON to prompt
example_json = {
    "plot_points": [
        {
            "title": "Hero discovers ancient artifact",
            "description": "While exploring the ruins, the hero finds a glowing amulet.",
            "event_type": "DISCOVERY",
            "timeline_position": 1,
            "chunk_index": 0,
            "characters": ["Hero"],
            "follows": [],
            "causes": [2]
        }
    ]
}

prompt = f"""...
Return a JSON object matching this exact format:
{json.dumps(example_json, indent=2)}
"""

# Validate response
try:
    validated = PlotExtractionResponse.parse_raw(result_text)
    plot_points_data = validated.plot_points
except ValidationError as e:
    logger.error(f"Plot extraction validation failed: {e}")
    logger.error(f"Raw LLM output: {result_text}")
    return {"status": "error", "error": str(e), "raw_output": result_text}
```

## Data Models

### Enhanced Entity Metadata

```python
{
    "status": "alive",
    "current_location": "Paris",
    "inventory": ["sword", "map"],
    "persona_summary": "A brave knight...",
    "story_summary": "Has traveled from...",
    "last_summary_update": "2024-01-15T10:30:00Z",  # NEW
    "mention_count": 42  # NEW: tracked during analysis
}
```

### Narrative Chunk with Hash

```sql
ALTER TABLE narrative_chunks ADD COLUMN content_hash TEXT;
CREATE INDEX idx_narrative_chunks_hash ON narrative_chunks(project_id, content_hash);
```

```python
import hashlib

def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()[:16]
```

### Projects Table Enhancement

```sql
-- Already exists, just ensure these are populated
ALTER TABLE projects 
    ALTER COLUMN target_pov SET DEFAULT 'Third Person',
    ALTER COLUMN tone_intention SET DEFAULT 'Balanced';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cache Consistency
*For any* project_id and any sequence of KG updates, reading from cache should return the same graph state as reading from the database.

**Validates: Requirements 4.6**

### Property 2: RAG Relevance Threshold
*For any* ghost text generation request, all retrieved chunks should have similarity score >= 0.3 OR the system should fall back to sequential history.

**Validates: Requirements 1.3**

### Property 3: WebSocket Reconnection
*For any* WebSocket disconnection event, the client should attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s).

**Validates: Requirements 2.4**

### Property 4: POV Consistency
*For any* ghost text suggestion where target_pov is "First Person", the suggestion should not contain third-person pronouns (he, she, they) referring to the protagonist.

**Validates: Requirements 3.5**

### Property 5: Character Summary Throttling
*For any* character entity, if last_summary_update is within 10 minutes, the summary generation should be skipped.

**Validates: Requirements 7.5**

### Property 6: Content Hash Uniqueness
*For any* narrative chunk, if a chunk with the same content_hash exists for the project, the new chunk should not be inserted.

**Validates: Requirements 8.7**

### Property 7: Plot Extraction Validation
*For any* LLM response from plot extraction, if the JSON does not match PlotExtractionResponse schema, the system should return an error with the raw output.

**Validates: Requirements 6.4**

### Property 8: Cache TTL Expiration
*For any* cached KG entry, if 5 minutes have elapsed since insertion, the next read should trigger a fresh load from the database.

**Validates: Requirements 4.5**

### Property 9: Style Blueprint Completeness
*For any* generated style_blueprint, it should contain all required fields: dominant_genre, dominant_emotion, avg_sentence_length, vocab_richness, style_anchors, top_vocabulary.

**Validates: Requirements 5.2**

### Property 10: Batch Character Summary Limit
*For any* analysis with N characters detected, at most 3 character summaries should be generated.

**Validates: Requirements 7.3**

## Error Handling

### WebSocket Error Handling

```python
class WebSocketError(Exception):
    pass

class ConnectionLostError(WebSocketError):
    pass

class MessageParseError(WebSocketError):
    pass

# In WebSocket handler
try:
    await websocket.send_json(payload)
except WebSocketDisconnect:
    logger.info(f"Client disconnected: {websocket.client}")
    await cleanup_connection(websocket)
except Exception as e:
    logger.error(f"WebSocket error: {e}")
    await websocket.send_json({"type": "error", "detail": str(e)})
```

### RAG Fallback Strategy

```python
def retrieve_relevant_chunks(self, project_id: str, query_text: str) -> list[dict]:
    try:
        embedding = get_embedding(query_text)
        chunks = self._vector_search(project_id, embedding)
        
        if not chunks or all(c["similarity"] < 0.3 for c in chunks):
            logger.warning(f"No relevant chunks found for project {project_id}, falling back to sequential")
            return self._get_recent_chunks(project_id, limit=3)
        
        return chunks
    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}, falling back to sequential")
        return self._get_recent_chunks(project_id, limit=3)
```

### Cache Error Handling

```python
def get(self, project_id: str) -> StoryKnowledgeGraph | None:
    try:
        with self._lock:
            return self._cache.get(project_id)
    except Exception as e:
        logger.error(f"Cache read error for {project_id}: {e}")
        return None  # Trigger fresh load

def set(self, project_id: str, kg: StoryKnowledgeGraph) -> None:
    try:
        with self._lock:
            self._cache[project_id] = kg
    except Exception as e:
        logger.error(f"Cache write error for {project_id}: {e}")
        # Continue without caching (degraded mode)
```

## Testing Strategy

### Unit Tests

Test individual components in isolation:

- `test_kg_cache.py`: Cache hit/miss, TTL expiration, LRU eviction, thread safety
- `test_rag_service.py`: Vector search, fallback logic, threshold filtering
- `test_suggestion_service.py`: POV injection, tone injection, RAG integration
- `test_analysis_orchestrator.py`: Mode switching, content hash deduplication
- `test_character_summary.py`: Throttling logic, batch processing, mention counting
- `test_plot_extraction.py`: Pydantic validation, error handling, partial data
- `test_style_blueprint.py`: Generation triggers, field completeness

### Property-Based Tests

Test universal properties across random inputs:

- **Property 1: Cache Consistency** - Generate random KG updates, verify cache matches DB
- **Property 2: RAG Relevance** - Generate random queries, verify all results meet threshold
- **Property 4: POV Consistency** - Generate random first-person contexts, verify no third-person pronouns in suggestions
- **Property 5: Character Summary Throttling** - Generate random timestamps, verify throttling logic
- **Property 6: Content Hash Uniqueness** - Generate random content, verify no duplicates inserted
- **Property 8: Cache TTL** - Generate random time deltas, verify expiration behavior
- **Property 10: Batch Limit** - Generate random character lists, verify max 3 summaries

### Integration Tests

Test end-to-end flows:

- WebSocket connection lifecycle (connect, analyze, disconnect, reconnect)
- Full analysis flow with RAG, KG cache, and character summaries
- Style blueprint generation from project setup
- Plot extraction with validation and error recovery

### Performance Tests

- KG cache performance: measure latency with/without cache (target: <50ms cached, <500ms uncached)
- RAG retrieval latency: measure vector search time (target: <200ms)
- Ghost text generation: measure end-to-end latency (target: <2s)
- WebSocket throughput: measure messages per second (target: >100 msg/s)
- Character summary batching: measure time for 3 vs 10 characters (target: <5s for 3)

## Implementation Notes

### Migration Strategy

1. **Phase 1: Infrastructure** (Week 1)
   - Implement KG cache service
   - Implement RAG service
   - Add content_hash column to narrative_chunks
   - Add last_summary_update to entity metadata

2. **Phase 2: Core Services** (Week 2)
   - Enhance suggestion service with RAG and POV/tone
   - Implement analysis orchestrator
   - Optimize character summary service
   - Add Pydantic models for plot extraction

3. **Phase 3: WebSocket** (Week 3)
   - Implement WebSocket manager
   - Update frontend to use WebSocket
   - Add connection status UI
   - Implement fallback to HTTP

4. **Phase 4: Style Blueprint** (Week 4)
   - Implement style blueprint service
   - Integrate with project setup
   - Add auto-generation triggers
   - Add regeneration endpoint

### Backward Compatibility

- All HTTP endpoints remain functional (WebSocket is additive)
- Existing narrative chunks without content_hash are handled gracefully
- Missing style_blueprint falls back to empty dict
- Cache misses trigger normal DB load (transparent to callers)

### Monitoring and Observability

```python
# Add metrics
from prometheus_client import Counter, Histogram

kg_cache_hits = Counter("kg_cache_hits_total", "KG cache hits")
kg_cache_misses = Counter("kg_cache_misses_total", "KG cache misses")
rag_retrieval_time = Histogram("rag_retrieval_seconds", "RAG retrieval latency")
ghost_text_generation_time = Histogram("ghost_text_generation_seconds", "Ghost text latency")
websocket_connections = Counter("websocket_connections_total", "WebSocket connections")
```

### Configuration

```python
# config.py additions
class Settings:
    # Cache settings
    kg_cache_ttl_seconds: int = 300  # 5 minutes
    kg_cache_max_size: int = 100
    
    # RAG settings
    rag_similarity_threshold: float = 0.3
    rag_top_k: int = 3
    
    # Character summary settings
    character_summary_throttle_seconds: int = 600  # 10 minutes
    character_summary_max_per_analysis: int = 3
    
    # WebSocket settings
    websocket_ping_interval_seconds: int = 30
    websocket_pong_timeout_seconds: int = 10
    
    # Style blueprint settings
    style_blueprint_min_chars: int = 500
    style_blueprint_trigger_word_count: int = 1000
```

This design provides a comprehensive, production-ready architecture that addresses all identified issues while maintaining backward compatibility and adding robust error handling, monitoring, and testing strategies.
