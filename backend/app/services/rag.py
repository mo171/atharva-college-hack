"""RAG (Retrieval-Augmented Generation) service for semantic retrieval."""

from __future__ import annotations

import logging
from typing import Any

from supabase import Client

from lib.supabase import supabase_client as _default_supabase
from services.llm_gateway import get_embedding

logger = logging.getLogger(__name__)


class RAGService:
    """
    Semantic retrieval service for narrative chunks using vector embeddings.
    
    Provides context-aware retrieval of story content for AI suggestions
    and character summaries using pgvector similarity search.
    """
    
    def __init__(self, supabase_client: Client | None = None):
        """
        Initialize the RAG service.
        
        Args:
            supabase_client: Optional Supabase client (uses default if not provided)
        """
        self.supabase = supabase_client or _default_supabase
    
    def retrieve_relevant_chunks(
        self,
        project_id: str,
        query_text: str,
        top_k: int = 3,
        threshold: float = 0.3
    ) -> list[dict[str, Any]]:
        """
        Retrieve semantically relevant narrative chunks for a query.
        
        Uses vector similarity search to find chunks that are contextually
        related to the query text. Falls back to sequential recent chunks
        if no relevant matches are found.
        
        Args:
            project_id: The project identifier
            query_text: The text to search for (will be embedded)
            top_k: Maximum number of chunks to return (default: 3)
            threshold: Minimum similarity score (0.0-1.0, default: 0.3)
            
        Returns:
            List of chunk dictionaries with keys:
            - content: The chunk text
            - similarity: Similarity score (0.0-1.0)
            - chunk_index: Sequential index of the chunk
        """
        try:
            # Generate embedding for the query
            query_embedding = get_embedding(query_text)
        except Exception as e:
            logger.error(f"Failed to generate embedding for query: {e}")
            return self._get_recent_chunks(project_id, limit=top_k)
        
        try:
            # Call the match_narrative_chunks RPC function
            rpc_result = self.supabase.rpc(
                "match_narrative_chunks",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": threshold,
                    "match_count": top_k,
                    "p_project_id": project_id,
                },
            ).execute()
            
            chunks = rpc_result.data or []
            
            # Check if we have any results above threshold
            if not chunks or all(chunk.get("similarity", 0) < threshold for chunk in chunks):
                logger.warning(
                    f"No relevant chunks found for project {project_id} "
                    f"(threshold={threshold}), falling back to sequential"
                )
                return self._get_recent_chunks(project_id, limit=top_k)
            
            # Format the results, filtering out chunks below threshold
            return [
                {
                    "content": chunk.get("content", ""),
                    "similarity": chunk.get("similarity", 0.0),
                    "chunk_index": chunk.get("chunk_index", 0),
                }
                for chunk in chunks
                if chunk.get("content") and chunk.get("similarity", 0) >= threshold
            ]
            
        except Exception as e:
            logger.error(f"RAG retrieval failed for project {project_id}: {e}, falling back to sequential")
            return self._get_recent_chunks(project_id, limit=top_k)
    
    def retrieve_for_character(
        self,
        project_id: str,
        character_name: str,
        top_k: int = 10
    ) -> list[dict[str, Any]]:
        """
        Retrieve narrative chunks relevant to a specific character.
        
        Optimized for character summary generation by searching for
        story events, actions, and descriptions involving the character.
        
        Args:
            project_id: The project identifier
            character_name: The character's name
            top_k: Maximum number of chunks to return (default: 10)
            
        Returns:
            List of chunk dictionaries with keys:
            - content: The chunk text
            - similarity: Similarity score (0.0-1.0)
            - chunk_index: Sequential index of the chunk
        """
        query_text = (
            f"Story events, actions, and descriptions involving the character {character_name}."
        )
        
        return self.retrieve_relevant_chunks(
            project_id=project_id,
            query_text=query_text,
            top_k=top_k,
            threshold=0.3
        )
    
    def _get_recent_chunks(self, project_id: str, limit: int = 3) -> list[dict[str, Any]]:
        """
        Fallback: retrieve the most recent narrative chunks sequentially.
        
        Args:
            project_id: The project identifier
            limit: Maximum number of chunks to return
            
        Returns:
            List of chunk dictionaries with content and chunk_index
        """
        try:
            result = (
                self.supabase.table("narrative_chunks")
                .select("content, chunk_index")
                .eq("project_id", project_id)
                .order("chunk_index", desc=True)
                .limit(limit)
                .execute()
            )
            
            chunks = result.data or []
            
            # Format to match the vector search response structure
            return [
                {
                    "content": chunk.get("content", ""),
                    "similarity": 0.0,  # No similarity score for sequential fallback
                    "chunk_index": chunk.get("chunk_index", 0),
                }
                for chunk in chunks
                if chunk.get("content")
            ]
            
        except Exception as e:
            logger.error(f"Failed to retrieve recent chunks for project {project_id}: {e}")
            return []
