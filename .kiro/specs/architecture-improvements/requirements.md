# Requirements Document: Architecture Improvements & Feature Activation

## Introduction

This specification addresses critical architectural improvements and feature activation for the AI-powered fiction writing assistant. The system currently has several powerful features that are either underutilized, disconnected, or causing performance issues. This document outlines requirements to optimize the architecture, activate dormant features, and improve the overall user experience.

## Glossary

- **System**: The AI-powered fiction writing assistant (backend + frontend)
- **Knowledge_Graph**: NetworkX MultiDiGraph storing story entities and relationships
- **RAG**: Retrieval-Augmented Generation using vector embeddings
- **Ghost_Text**: AI-generated writing suggestions shown in the editor
- **Style_Blueprint**: Author's writing style DNA (genre, emotion, vocabulary, sentence structure)
- **WebSocket**: Real-time bidirectional communication protocol
- **Narrative_Chunk**: A segment of story text stored with vector embedding
- **KG_Cache**: In-memory cache of the Knowledge Graph to avoid repeated DB queries

## Requirements

### Requirement 1: RAG-Enhanced Ghost Text Suggestions

**User Story:** As a writer, I want AI suggestions that reference relevant past scenes from my story, so that the suggestions are contextually grounded and maintain narrative continuity.

#### Acceptance Criteria

1. WHEN generating ghost text suggestions, THE System SHALL retrieve semantically relevant narrative chunks using vector similarity search
2. WHEN the vector search returns relevant chunks, THE System SHALL include them in the LLM context as "RELEVANT PAST SCENES"
3. WHEN no relevant chunks are found (similarity < 0.3), THE System SHALL fall back to sequential recent history
4. THE System SHALL limit retrieved chunks to top 3 most relevant to avoid context bloat
5. THE System SHALL maintain response time under 2 seconds for ghost text generation
6. THE System SHALL use the same embedding model (text-embedding-3-small) for consistency

### Requirement 2: WebSocket Real-Time Analysis

**User Story:** As a writer, I want real-time analysis as I type, so that I get immediate feedback without clicking "Analyze" button.

#### Acceptance Criteria

1. WHEN the editor is loaded, THE System SHALL establish a WebSocket connection to /ws/editor
2. WHEN the user stops typing for 2 seconds, THE System SHALL send analysis request via WebSocket
3. WHEN analysis completes, THE System SHALL receive results via WebSocket and update UI
4. WHEN the WebSocket connection drops, THE System SHALL attempt reconnection with exponential backoff
5. THE System SHALL display connection status (connected/disconnected) in the editor footer
6. WHEN WebSocket is unavailable, THE System SHALL fall back to HTTP analysis
7. THE System SHALL send ping/pong messages every 30 seconds to keep connection alive

### Requirement 3: POV and Tone Integration in Suggestions

**User Story:** As a writer, I want AI suggestions that respect my chosen POV and tone, so that suggestions match my narrative voice.

#### Acceptance Criteria

1. WHEN generating ghost text, THE System SHALL fetch target_pov from the projects table
2. WHEN generating ghost text, THE System SHALL fetch tone_intention from the projects table
3. WHEN target_pov is set, THE System SHALL include it in the LLM system prompt with explicit instructions
4. WHEN tone_intention is set, THE System SHALL include it in the LLM system prompt with explicit instructions
5. THE System SHALL validate POV consistency (e.g., "First Person" should not suggest "he walked")
6. WHEN POV or tone is missing, THE System SHALL infer from style_blueprint or use neutral defaults

### Requirement 4: Knowledge Graph Caching

**User Story:** As a system administrator, I want the knowledge graph to be cached, so that analysis performance is fast even for large projects.

#### Acceptance Criteria

1. THE System SHALL implement an in-memory cache for Knowledge_Graph instances keyed by project_id
2. WHEN a Knowledge_Graph is requested, THE System SHALL check the cache first
3. WHEN a cache hit occurs, THE System SHALL return the cached graph without DB queries
4. WHEN a cache miss occurs, THE System SHALL load from Supabase and store in cache
5. THE System SHALL invalidate cache entries after 5 minutes (TTL)
6. WHEN new facts are added to the graph, THE System SHALL update both cache and database
7. THE System SHALL use a thread-safe cache implementation (e.g., cachetools with locks)
8. THE System SHALL limit cache size to 100 projects (LRU eviction)

### Requirement 5: Style Blueprint Activation

**User Story:** As a writer, I want my writing style to be automatically analyzed during project setup, so that AI suggestions match my voice from the start.

#### Acceptance Criteria

1. WHEN a new project is created with world_setting text, THE System SHALL analyze the text to generate style_blueprint
2. WHEN style_blueprint is generated, THE System SHALL store dominant_genre, dominant_emotion, avg_sentence_length, vocab_richness, style_anchors, and top_vocabulary
3. WHEN generating ghost text, THE System SHALL use ALL fields from style_blueprint (not just anchors and vocabulary)
4. WHEN style_blueprint is missing, THE System SHALL generate it from the first 3 narrative chunks
5. THE System SHALL expose a /projects/{id}/regenerate-blueprint endpoint to recompute style from all chunks
6. THE System SHALL display style_blueprint summary in the project settings UI

### Requirement 6: Plot Extraction JSON Validation

**User Story:** As a system administrator, I want plot extraction to be robust, so that LLM output variations don't cause silent failures.

#### Acceptance Criteria

1. THE System SHALL define a Pydantic model for plot extraction response (PlotPointExtraction)
2. WHEN LLM returns plot extraction JSON, THE System SHALL validate against the Pydantic schema
3. WHEN validation fails, THE System SHALL log the error with the raw LLM output
4. WHEN validation fails, THE System SHALL return a user-friendly error message
5. THE System SHALL use OpenAI's response_format={"type": "json_object"} to enforce JSON output
6. THE System SHALL include example JSON in the LLM prompt for few-shot guidance
7. WHEN partial data is valid, THE System SHALL save valid plot points and report invalid ones

### Requirement 7: Optimized Character Summary Generation

**User Story:** As a system administrator, I want character summaries to be generated efficiently, so that analysis doesn't slow down with many characters.

#### Acceptance Criteria

1. THE System SHALL batch character summary updates instead of running per-character
2. WHEN analysis detects multiple characters, THE System SHALL collect all character IDs first
3. THE System SHALL generate summaries for max 3 characters per analysis (most frequently mentioned)
4. THE System SHALL track last_summary_update timestamp in entity metadata
5. THE System SHALL skip summary generation if last update was within 10 minutes
6. THE System SHALL expose a manual refresh endpoint for on-demand updates
7. THE System SHALL run summary generation asynchronously (background task) to avoid blocking analysis

### Requirement 8: Unified Save and Analysis Flow

**User Story:** As a writer, I want auto-save and analysis to work together seamlessly, so that my knowledge graph is always up-to-date with saved content.

#### Acceptance Criteria

1. THE System SHALL merge /editor/save and /editor/analyze into a single flow
2. WHEN auto-save triggers, THE System SHALL save the chunk AND update the knowledge graph
3. WHEN the user clicks "Analyze", THE System SHALL run full analysis (extraction + KG + alerts)
4. THE System SHALL add a lightweight flag to distinguish auto-save from manual analysis
5. WHEN auto-save runs, THE System SHALL skip expensive operations (character summaries, plot extraction)
6. WHEN manual analysis runs, THE System SHALL run all operations including summaries
7. THE System SHALL ensure narrative chunks are never duplicated (check content hash before insert)

### Requirement 9: RAG for Character Context (Enhanced)

**User Story:** As a writer, I want character summaries to include the most relevant story moments, so that character profiles are accurate and comprehensive.

#### Acceptance Criteria

1. WHEN generating character summaries, THE System SHALL use vector search to find top 10 relevant chunks
2. THE System SHALL use character name as the query for vector search
3. WHEN vector search returns fewer than 5 chunks, THE System SHALL supplement with recent sequential chunks
4. THE System SHALL deduplicate chunks before sending to LLM
5. THE System SHALL include chunk timestamps in the summary context for temporal awareness
6. THE System SHALL limit total context to 4000 tokens to avoid LLM truncation

### Requirement 10: Style Blueprint from Initial Content

**User Story:** As a writer, I want my style to be captured from my initial project setup, so that I don't need to upload a separate document.

#### Acceptance Criteria

1. WHEN a project is created with world_setting longer than 500 characters, THE System SHALL run style analysis
2. WHEN a project is created with character descriptions totaling > 300 characters, THE System SHALL run style analysis
3. WHEN style analysis runs during setup, THE System SHALL store the blueprint in projects.style_blueprint
4. WHEN insufficient text is provided during setup, THE System SHALL defer style analysis until first narrative chunk
5. THE System SHALL automatically trigger style analysis after the first 1000 words are written
6. THE System SHALL display a "Style Calibration" progress indicator in the UI during analysis

## Requirements Summary

This specification defines 10 core requirements to optimize the architecture and activate dormant features:

1. RAG-enhanced ghost text with semantic retrieval
2. WebSocket real-time analysis
3. POV and tone integration in suggestions
4. Knowledge graph caching for performance
5. Style blueprint activation from initial content
6. Robust plot extraction with JSON validation
7. Optimized character summary generation
8. Unified save and analysis flow
9. Enhanced RAG for character context
10. Automatic style blueprint generation

All requirements are designed to improve performance, user experience, and feature utilization without breaking existing functionality.
