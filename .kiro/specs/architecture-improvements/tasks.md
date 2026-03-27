# Implementation Plan: Architecture Improvements & Feature Activation

## Overview

This implementation plan breaks down the architecture improvements into discrete, testable tasks. The plan follows a 4-phase approach to minimize risk and ensure each component is validated before integration.

## Tasks

- [x] 1. Phase 1: Infrastructure Layer (Caching & RAG)
  - Set up foundational services for caching and semantic retrieval
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.1 Create KG cache service with TTL and LRU eviction
  - Create `backend/app/services/kg_cache.py`
  - Implement `KGCache` class with `cachetools.TTLCache`
  - Add thread-safe operations with `threading.RLock`
  - Implement `get()`, `set()`, `invalidate()`, `update_fact()` methods
  - Configure TTL=300s, max_size=100, LRU policy
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 1.2 Write property test for KG cache consistency

  - **Property 1: Cache Consistency**
  - **Validates: Requirements 4.6**

- [ ]* 1.3 Write unit tests for KG cache
  - Test cache hit/miss scenarios
  - Test TTL expiration behavior
  - Test LRU eviction with 101 entries
  - Test thread safety with concurrent access
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8_

- [x] 1.4 Create RAG service for semantic retrieval
  - Create `backend/app/services/rag.py`
  - Implement `RAGService` class
  - Implement `retrieve_relevant_chunks()` with vector search
  - Implement `retrieve_for_character()` for character summaries
  - Add fallback to sequential chunks when similarity < 0.3
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.5 Write property test for RAG relevance threshold

  - **Property 2: RAG Relevance Threshold**
  - **Validates: Requirements 1.3**

- [ ]* 1.6 Write unit tests for RAG service
  - Test vector search with mock embeddings
  - Test fallback logic when no results
  - Test threshold filtering
  - Test character-specific retrieval
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.7 Add content_hash column to narrative_chunks table
  - Create migration SQL file
  - Add `content_hash TEXT` column
  - Create index on `(project_id, content_hash)`
  - Update `ExtractionStore.insert_narrative_chunk()` to compute and store hash
  - _Requirements: 8.7_

- [ ]* 1.8 Write property test for content hash uniqueness
  - **Property 6: Content Hash Uniqueness**
  - **Validates: Requirements 8.7**

- [x] 1.9 Add configuration for cache and RAG settings
  - Update `backend/app/config.py` with cache settings
  - Add `kg_cache_ttl_seconds`, `kg_cache_max_size`
  - Add `rag_similarity_threshold`, `rag_top_k`
  - Add `character_summary_throttle_seconds`, `character_summary_max_per_analysis`
  - _Requirements: 4.5, 1.3, 1.4, 7.5, 7.3_

- [x] 2. Phase 2: Core Service Enhancements
  - Enhance existing services with RAG, POV/tone, and optimization
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 2.1 Enhance suggestion service with RAG and POV/tone
  - Modify `SuggestionService.get_ghost_suggestion()` signature to accept `project_id`
  - Fetch `target_pov` and `tone_intention` from projects table
  - Integrate `RAGService` to retrieve relevant scenes
  - Update system prompt to include POV instructions, tone, and relevant scenes
  - Add POV validation logic (e.g., first-person check)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 1.1, 1.2, 1.3_

- [x] 2.2 Write property test for POV consistency

  - **Property 4: POV Consistency**
  - **Validates: Requirements 3.5**

- [ ]* 2.3 Write unit tests for enhanced suggestion service
  - Test POV injection in system prompt
  - Test tone injection in system prompt
  - Test RAG integration with relevant scenes
  - Test fallback when no relevant scenes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [x] 2.4 Create analysis orchestrator for unified save/analyze flow
  - Create `backend/app/services/analysis_orchestrator.py`
  - Implement `AnalysisOrchestrator` class
  - Implement `process_content()` with mode parameter (auto_save, manual_analyze)
  - Implement `_run_lightweight_analysis()` for auto-save
  - Implement `_run_full_analysis()` for manual analyze
  - Implement `_batch_character_summaries()` as background task
  - Add content hash check before inserting chunks
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ]* 2.5 Write unit tests for analysis orchestrator
  - Test mode switching (auto_save vs manual_analyze)
  - Test content hash deduplication
  - Test lightweight analysis flow
  - Test full analysis flow
  - Test background task scheduling
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 2.6 Optimize character summary service
  - Add `should_update_summary()` function with 10-minute throttle
  - Add `last_summary_update` timestamp to entity metadata
  - Implement `batch_update_character_summaries()` with max 3 limit
  - Add mention counting during analysis
  - Sort characters by mention count before batching
  - Use `asyncio.gather()` for parallel summary generation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ]* 2.7 Write property test for character summary throttling
  - **Property 5: Character Summary Throttling**
  - **Validates: Requirements 7.5**

- [ ]* 2.8 Write property test for batch character summary limit
  - **Property 10: Batch Character Summary Limit**
  - **Validates: Requirements 7.3**

- [ ]* 2.9 Write unit tests for optimized character summary
  - Test throttling logic with various timestamps
  - Test batch processing with 5 characters (expect 3 summaries)
  - Test mention counting and sorting
  - Test parallel execution with asyncio
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 2.10 Integrate KG cache into analysis flow
  - Modify `routes/editor.py` to use `KGCache` instead of direct `from_supabase()`
  - Update `run_analysis()` to get KG from cache
  - Update `StoryKnowledgeGraph.add_fact()` to update cache via `KGCache.update_fact()`
  - Add cache invalidation on project deletion
  - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

- [x] 2.11 Update editor routes to use analysis orchestrator
  - Modify `/editor/save` to use `AnalysisOrchestrator.process_content(mode="auto_save")`
  - Modify `/editor/analyze` to use `AnalysisOrchestrator.process_content(mode="manual_analyze")`
  - Remove duplicate logic from both endpoints
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [-] 3. Phase 3: WebSocket Real-Time Analysis
  - Activate WebSocket for real-time communication
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3.1 Create WebSocket manager service
  - Create `backend/app/lib/websocket_manager.py`
  - Implement `WebSocketManager` class
  - Implement `handle_connection()` with message routing
  - Implement `keepalive_loop()` with 30s ping interval
  - Implement `send_analysis()`, `send_error()` helper methods
  - Add connection tracking and cleanup
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

- [ ]* 3.2 Write property test for WebSocket reconnection
  - **Property 3: WebSocket Reconnection**
  - **Validates: Requirements 2.4**

- [ ]* 3.3 Write unit tests for WebSocket manager
  - Test connection lifecycle (connect, message, disconnect)
  - Test keepalive ping/pong
  - Test message routing by type
  - Test error handling and cleanup
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.7_

- [ ] 3.4 Update WebSocket route to use manager and orchestrator
  - Modify `routes/ws_editor.py` to use `WebSocketManager`
  - Update message handling to use `AnalysisOrchestrator`
  - Add support for "save" message type (auto_save mode)
  - Add support for "analyze" message type (manual_analyze mode)
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2_

- [ ] 3.5 Create frontend WebSocket client
  - Create `frontend/lib/editorSocket.js` (if not exists, enhance existing)
  - Implement connection management with reconnection logic
  - Implement exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Implement ping/pong handling
  - Add connection status tracking
  - Add fallback to HTTP on connection failure
  - _Requirements: 2.1, 2.2, 2.4, 2.6_

- [ ] 3.6 Write integration tests for WebSocket flow

  - Test full analysis flow via WebSocket
  - Test auto-save flow via WebSocket
  - Test reconnection after disconnect
  - Test fallback to HTTP
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [ ] 3.7 Update EditorContainer to use WebSocket
  - Modify `frontend/features/editor/containers/EditorContainer.jsx`
  - Replace HTTP calls with WebSocket messages
  - Add connection status display in editor footer
  - Implement fallback to HTTP when WebSocket unavailable
  - Update debounce logic to send via WebSocket
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [ ] 3.8 Update EditorContent to show connection status
  - Modify `frontend/app/components/editor/EditorContent.jsx`
  - Add connection status indicator (connected/disconnected/reconnecting)
  - Update sync status to reflect WebSocket state
  - _Requirements: 2.5_

- [ ] 4. Phase 4: Style Blueprint & Plot Validation
  - Activate style blueprint generation and add plot extraction validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 4.1 Create style blueprint service
  - Create `backend/app/services/style_blueprint.py`
  - Implement `StyleBlueprintService` class
  - Implement `should_generate_blueprint()` with trigger logic
  - Implement `generate_from_setup()` for project setup text
  - Implement `generate_from_chunks()` for accumulated narrative
  - Implement `get_blueprint()` with fallback to empty dict
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 4.2 Write property test for style blueprint completeness
  - **Property 9: Style Blueprint Completeness**
  - **Validates: Requirements 5.2**

- [ ]* 4.3 Write unit tests for style blueprint service
  - Test generation from setup text (>500 chars)
  - Test generation from chunks (>1000 words)
  - Test trigger logic with various text lengths
  - Test fallback to empty dict
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.4 Integrate style blueprint into project setup
  - Modify `services/project_setup.py`
  - Add style blueprint generation when world_setting > 500 chars
  - Add style blueprint generation when total character descriptions > 300 chars
  - Store blueprint in projects.style_blueprint
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4.5 Add auto-generation trigger after 1000 words
  - Modify `AnalysisOrchestrator` to track total word count
  - Trigger style blueprint generation when word count reaches 1000
  - Store blueprint in projects.style_blueprint
  - _Requirements: 5.5_

- [ ] 4.6 Add regenerate blueprint endpoint
  - Add `POST /projects/{project_id}/regenerate-blueprint` route
  - Fetch all narrative chunks for project
  - Concatenate chunks and run style analysis
  - Update projects.style_blueprint
  - _Requirements: 5.5_

- [ ] 4.7 Create Pydantic models for plot extraction
  - Create `backend/app/models/plot_extraction.py`
  - Define `PlotPointData` model with validation
  - Define `PlotExtractionResponse` model
  - Add validators for characters list, timeline_position, event_type
  - _Requirements: 6.1, 6.2_

- [ ]* 4.8 Write property test for plot extraction validation
  - **Property 7: Plot Extraction Validation**
  - **Validates: Requirements 6.4**

- [ ]* 4.9 Write unit tests for plot extraction models
  - Test valid plot point data
  - Test invalid event_type (should fail)
  - Test negative timeline_position (should fail)
  - Test character list validation
  - _Requirements: 6.1, 6.2_

- [ ] 4.10 Update plot extraction service with validation
  - Modify `services/plot_extraction.py`
  - Add example JSON to LLM prompt
  - Use `response_format={"type": "json_object"}` in OpenAI call
  - Validate response with `PlotExtractionResponse.parse_raw()`
  - Add error logging with raw LLM output on validation failure
  - Handle partial valid data (save valid points, report invalid)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 4.11 Write integration tests for plot extraction
  - Test successful extraction with valid JSON
  - Test validation failure with invalid JSON
  - Test partial data handling
  - Test error response format
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_

- [ ] 4.12 Add style blueprint display in frontend
  - Create style blueprint component in project settings
  - Display dominant_genre, dominant_emotion, avg_sentence_length, vocab_richness
  - Display style_anchors as example sentences
  - Display top_vocabulary as word cloud or list
  - Add "Regenerate Blueprint" button
  - _Requirements: 5.6_

- [ ] 5. Phase 5: Monitoring & Documentation
  - Add observability and update documentation
  - _Requirements: All_

- [ ] 5.1 Add Prometheus metrics
  - Install `prometheus_client` package
  - Add metrics for KG cache hits/misses
  - Add metrics for RAG retrieval latency
  - Add metrics for ghost text generation latency
  - Add metrics for WebSocket connections
  - Add metrics for character summary generation
  - Expose `/metrics` endpoint

- [ ] 5.2 Add logging for key operations
  - Add structured logging for cache operations
  - Add logging for RAG fallback events
  - Add logging for WebSocket connection events
  - Add logging for style blueprint generation
  - Add logging for plot extraction validation failures

- [ ] 5.3 Update API documentation
  - Document new `/projects/{id}/regenerate-blueprint` endpoint
  - Document WebSocket message format and types
  - Document analysis orchestrator modes
  - Update OpenAPI schema

- [ ] 5.4 Create migration guide
  - Document database migrations (content_hash column)
  - Document configuration changes
  - Document breaking changes (if any)
  - Document rollback procedures

- [ ] 5.5 Update README with new features
  - Document RAG-enhanced suggestions
  - Document WebSocket real-time analysis
  - Document style blueprint auto-generation
  - Document performance improvements

- [ ] 6. Final Checkpoint - Integration Testing
  - Ensure all components work together seamlessly

- [ ] 6.1 Run full end-to-end test suite
  - Test project creation with style blueprint
  - Test writing with WebSocket analysis
  - Test ghost text with RAG and POV/tone
  - Test character summaries with throttling
  - Test plot extraction with validation
  - Test KG cache performance

- [ ] 6.2 Performance benchmarking
  - Measure KG cache hit rate (target: >80%)
  - Measure RAG retrieval latency (target: <200ms)
  - Measure ghost text generation (target: <2s)
  - Measure WebSocket throughput (target: >100 msg/s)
  - Measure character summary time (target: <5s for 3)

- [ ] 6.3 Load testing
  - Test with 100 concurrent WebSocket connections
  - Test with 1000+ narrative chunks per project
  - Test with 100+ entities per project
  - Test cache eviction under load

- [ ] 6.4 User acceptance testing
  - Test with real writing workflow
  - Verify ghost text quality with RAG
  - Verify POV consistency in suggestions
  - Verify style blueprint accuracy
  - Verify WebSocket stability

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP
- Each phase should be completed and tested before moving to the next
- Database migrations should be run before deploying Phase 1
- WebSocket requires frontend and backend changes to be deployed together
- Style blueprint generation is CPU-intensive; consider running in background worker for production
- Cache size and TTL can be tuned based on production metrics
- All property tests should run with minimum 100 iterations
- Integration tests should use test database to avoid polluting production data
