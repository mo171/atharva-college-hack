"""Knowledge Graph caching service with TTL and LRU eviction."""

from __future__ import annotations

import threading
from typing import TYPE_CHECKING

from cachetools import TTLCache

if TYPE_CHECKING:
    from services.analysis import StoryKnowledgeGraph


class KGCache:
    """
    Thread-safe in-memory cache for StoryKnowledgeGraph instances.
    
    Uses TTL (Time-To-Live) expiration and LRU (Least Recently Used) eviction
    to manage memory usage while providing fast access to knowledge graphs.
    
    Configuration:
    - TTL: 300 seconds (5 minutes)
    - Max size: 100 projects
    - Eviction policy: LRU (Least Recently Used)
    """
    
    def __init__(self, ttl_seconds: int = 300, max_size: int = 100):
        """
        Initialize the KG cache.
        
        Args:
            ttl_seconds: Time-to-live for cache entries in seconds (default: 300)
            max_size: Maximum number of projects to cache (default: 100)
        """
        self._cache: TTLCache = TTLCache(maxsize=max_size, ttl=ttl_seconds)
        self._lock = threading.RLock()
    
    def get(self, project_id: str) -> StoryKnowledgeGraph | None:
        """
        Retrieve a cached knowledge graph for a project.
        
        Args:
            project_id: The project identifier
            
        Returns:
            The cached StoryKnowledgeGraph instance, or None if not cached or expired
        """
        try:
            with self._lock:
                return self._cache.get(project_id)
        except Exception:
            # If cache read fails, return None to trigger fresh load
            return None
    
    def set(self, project_id: str, kg: StoryKnowledgeGraph) -> None:
        """
        Store a knowledge graph in the cache.
        
        Args:
            project_id: The project identifier
            kg: The StoryKnowledgeGraph instance to cache
        """
        try:
            with self._lock:
                self._cache[project_id] = kg
        except Exception:
            # If cache write fails, continue without caching (degraded mode)
            pass
    
    def invalidate(self, project_id: str) -> None:
        """
        Remove a knowledge graph from the cache.
        
        Args:
            project_id: The project identifier to invalidate
        """
        try:
            with self._lock:
                self._cache.pop(project_id, None)
        except Exception:
            # If invalidation fails, the entry will expire naturally via TTL
            pass
    
    def update_fact(
        self,
        project_id: str,
        subject: str,
        relation: str,
        obj: str
    ) -> None:
        """
        Update a fact in the cached knowledge graph.
        
        This is a write-through operation: it updates the cached graph
        but does NOT persist to the database. The caller is responsible
        for database persistence.
        
        Args:
            project_id: The project identifier
            subject: The subject entity
            relation: The relationship type
            obj: The object entity
        """
        try:
            with self._lock:
                kg = self._cache.get(project_id)
                if kg is not None:
                    # Update the in-memory graph
                    # Note: persist=False because the caller handles DB writes
                    kg.add_fact(subject, relation, obj, persist=False)
        except Exception:
            # If update fails, invalidate the cache entry
            # Next access will trigger a fresh load
            self.invalidate(project_id)


# Global cache instance
_kg_cache_instance: KGCache | None = None


def get_kg_cache(ttl_seconds: int = 300, max_size: int = 100) -> KGCache:
    """
    Get or create the global KG cache instance.
    
    Args:
        ttl_seconds: Time-to-live for cache entries (default: 300)
        max_size: Maximum cache size (default: 100)
        
    Returns:
        The global KGCache instance
    """
    global _kg_cache_instance
    if _kg_cache_instance is None:
        _kg_cache_instance = KGCache(ttl_seconds=ttl_seconds, max_size=max_size)
    return _kg_cache_instance
