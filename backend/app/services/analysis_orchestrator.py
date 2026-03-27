"""Analysis orchestrator for unified save/analyze flow."""

from __future__ import annotations

import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Literal

from supabase import Client

from lib.supabase import supabase_client as _default_supabase
from services.analysis import StoryKnowledgeGraph
from services.kg_cache import get_kg_cache
from services.character_summary import batch_update_character_summaries
from services.correction import get_correction_suite
from services.extraction import (
    ENTITY_LABEL_MAP,
    ExtractionStore,
    get_cached_nlp_pipeline,
    run_core_nlp_pipeline,
)
from services.llm_gateway import get_embedding, SupabaseInsightService

logger = logging.getLogger(__name__)


class AnalysisOrchestrator:
    """
    Orchestrates the unified save and analysis flow.
    
    Provides two modes:
    - auto_save: Lightweight analysis for auto-save (NER only, no summaries)
    - manual_analyze: Full analysis with KG updates, summaries, and alerts
    """
    
    def __init__(self, supabase_client: Client | None = None):
        """
        Initialize the analysis orchestrator.
        
        Args:
            supabase_client: Optional Supabase client (uses default if not provided)
        """
        self.supabase = supabase_client or _default_supabase
        self.kg_cache = get_kg_cache()
    
    async def process_content(
        self,
        project_id: str,
        content: str,
        mode: Literal["auto_save", "manual_analyze"] = "auto_save"
    ) -> dict[str, Any]:
        """
        Process content based on the specified mode.
        
        Args:
            project_id: The project identifier
            content: The narrative content to process
            mode: Processing mode - "auto_save" for lightweight, "manual_analyze" for full
            
        Returns:
            Dictionary with processing results including status, entities, and alerts
        """
        if mode == "auto_save":
            return await self._run_lightweight_analysis(project_id, content)
        else:
            return await self._run_full_analysis(project_id, content)
    
    async def _run_lightweight_analysis(
        self,
        project_id: str,
        content: str
    ) -> dict[str, Any]:
        """
        Run lightweight analysis for auto-save.
        
        Performs:
        - Content hash check (skip if duplicate)
        - Embedding generation
        - Narrative chunk storage
        - Basic NER extraction
        - Entity upsert (no relationships)
        
        Args:
            project_id: The project identifier
            content: The narrative content
            
        Returns:
            Dictionary with status and basic entity information
        """
        try:
            # Check content hash to avoid duplicates
            content_hash = self._compute_content_hash(content)
            
            existing = (
                self.supabase.table("narrative_chunks")
                .select("id")
                .eq("project_id", project_id)
                .eq("content_hash", content_hash)
                .limit(1)
                .execute()
            )
            
            if existing.data:
                logger.info(f"Duplicate content detected for project {project_id}, skipping save")
                return {
                    "status": "skipped",
                    "reason": "duplicate_content",
                    "entities": [],
                    "alerts": []
                }
            
            # Run NER extraction only (no SVO triples)
            nlp = get_cached_nlp_pipeline(model_name="en_core_web_sm", enable_coref=False)
            result = run_core_nlp_pipeline(content, nlp)
            
            # Generate embedding
            embedding = None
            try:
                embedding = get_embedding(result.normalized_text)
            except Exception as e:
                logger.error(f"Failed to generate embedding: {e}")
            
            # Save narrative chunk with content hash
            store = ExtractionStore(project_id=project_id, supabase_client=self.supabase)
            store.insert_narrative_chunk(
                content=result.normalized_text,
                embedding=embedding,
                content_hash=content_hash
            )
            
            # Upsert entities (no relationships in lightweight mode)
            store.upsert_entities(result.entities)
            
            entities_out = [
                {"name": e["text"], "type": e.get("label", "OBJECT")}
                for e in result.entities
            ]
            
            return {
                "status": "saved",
                "entities": entities_out,
                "alerts": [],
                "resolved_context": result.normalized_text
            }
            
        except Exception as e:
            logger.error(f"Lightweight analysis failed for project {project_id}: {e}")
            return {
                "status": "error",
                "error": str(e),
                "entities": [],
                "alerts": []
            }
    
    async def _run_full_analysis(
        self,
        project_id: str,
        content: str
    ) -> dict[str, Any]:
        """
        Run full analysis for manual analyze.
        
        Performs:
        - Content hash check
        - Full NER + SVO triple extraction
        - Knowledge graph update
        - Inconsistency detection
        - Alert generation
        - Character summary updates (background task)
        
        Args:
            project_id: The project identifier
            content: The narrative content
            
        Returns:
            Dictionary with full analysis results
        """
        try:
            # Check content hash
            content_hash = self._compute_content_hash(content)
            
            existing = (
                self.supabase.table("narrative_chunks")
                .select("id")
                .eq("project_id", project_id)
                .eq("content_hash", content_hash)
                .limit(1)
                .execute()
            )
            
            if existing.data:
                logger.info(f"Duplicate content detected for project {project_id}, skipping analysis")
                # Still run analysis on existing content, just don't re-save
                pass
            else:
                # Run full extraction (NER + SVO triples)
                nlp = get_cached_nlp_pipeline(model_name="en_core_web_sm", enable_coref=False)
                result = run_core_nlp_pipeline(content, nlp)
                
                # Generate embedding
                embedding = None
                try:
                    embedding = get_embedding(result.normalized_text)
                except Exception as e:
                    logger.error(f"Failed to generate embedding: {e}")
                
                # Save narrative chunk
                store = ExtractionStore(project_id=project_id, supabase_client=self.supabase)
                store.insert_narrative_chunk(
                    content=result.normalized_text,
                    embedding=embedding,
                    content_hash=content_hash
                )
                
                # Upsert entities
                store.upsert_entities(result.entities)
            
            # Always run extraction for analysis (even if chunk exists)
            nlp = get_cached_nlp_pipeline(model_name="en_core_web_sm", enable_coref=False)
            result = run_core_nlp_pipeline(content, nlp)
            
            # Update knowledge graph using cache
            kg = self._get_or_load_kg(project_id)
            kg.apply_svo_triples(result.triples, persist=True, original_text=content)
            
            # Update cache after modifications
            self.kg_cache.set(project_id, kg)
            
            # Generate insights and alerts
            insight_service = SupabaseInsightService(project_id=project_id)
            alerts_data = insight_service.process_pending_logs()
            
            # Run correction suite for polish alerts
            correction_suite = get_correction_suite()
            polish_alerts = correction_suite.analyze_polish(content)
            
            # Collect character names for summary updates with mention counts
            character_mentions: dict[str, int] = {}
            for e in result.entities:
                name = e["text"].strip()
                if name and ENTITY_LABEL_MAP.get(e.get("label", ""), "OBJECT") == "CHARACTER":
                    character_mentions[name] = character_mentions.get(name, 0) + 1
            
            unique_character_names = list(character_mentions.keys())
            
            # Schedule character summary updates as background task
            if unique_character_names:
                asyncio.create_task(
                    self._batch_character_summaries(
                        project_id,
                        unique_character_names,
                        character_mentions
                    )
                )
            
            # Format response
            entities_out = [
                {"name": e["text"], "type": e.get("label", "OBJECT")}
                for e in result.entities
            ]
            
            alerts_out = [
                {
                    "id": item.get("log_id"),
                    "type": "INCONSISTENCY",
                    "entity": None,
                    "explanation": item["alert"],
                    "original_text": item.get("original_text"),
                }
                for item in alerts_data
            ]
            alerts_out.extend(polish_alerts)
            
            detected_actions = [
                {
                    "subject": t.subject,
                    "relation": t.relation,
                    "object": t.object,
                    "sentence": t.sentence,
                }
                for t in result.triples
            ]
            
            return {
                "status": "success",
                "entities": entities_out,
                "alerts": alerts_out,
                "resolved_context": result.normalized_text,
                "detected_actions": detected_actions
            }
            
        except Exception as e:
            logger.error(f"Full analysis failed for project {project_id}: {e}")
            return {
                "status": "error",
                "error": str(e),
                "entities": [],
                "alerts": []
            }
    
    async def _batch_character_summaries(
        self,
        project_id: str,
        character_names: list[str],
        mention_counts: dict[str, int] | None = None
    ) -> None:
        """
        Update character summaries in batch as a background task.
        
        Uses the optimized batch_update_character_summaries function with
        throttling, mention-based prioritization, and parallel execution.
        
        Args:
            project_id: The project identifier
            character_names: List of character names to update
            mention_counts: Optional dict of character name to mention count
        """
        try:
            from config import settings
            
            await batch_update_character_summaries(
                project_id=project_id,
                character_names=character_names,
                mention_counts=mention_counts,
                max_updates=settings.character_summary_max_per_analysis,
                supabase_client=self.supabase
            )
                    
        except Exception as e:
            logger.error(f"Batch character summary update failed: {e}")
    
    @staticmethod
    def _compute_content_hash(content: str) -> str:
        """
        Compute a hash of the content for deduplication.
        
        Args:
            content: The content to hash
            
        Returns:
            16-character hex hash of the content
        """
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _get_or_load_kg(self, project_id: str) -> StoryKnowledgeGraph:
        """
        Get knowledge graph from cache or load from database.
        
        Args:
            project_id: The project identifier
            
        Returns:
            The StoryKnowledgeGraph instance
        """
        # Try to get from cache
        kg = self.kg_cache.get(project_id)
        
        if kg is None:
            # Cache miss - load from database
            kg = StoryKnowledgeGraph.from_supabase(
                project_id=project_id,
                supabase_client=self.supabase
            )
            # Store in cache
            self.kg_cache.set(project_id, kg)
        
        return kg
