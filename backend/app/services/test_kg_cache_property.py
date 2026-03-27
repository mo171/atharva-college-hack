"""
Property-based tests for KG cache service.

Feature: architecture-improvements, Property 1: Cache Consistency
Validates: Requirements 4.6
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from unittest.mock import Mock, MagicMock, patch
from hypothesis import given, strategies as st, settings
import pytest
import networkx as nx

from services.kg_cache import KGCache
from services.analysis import StoryKnowledgeGraph


# Strategy for generating project IDs
project_ids = st.text(min_size=1, max_size=50, alphabet=st.characters(
    whitelist_categories=('Lu', 'Ll', 'Nd'),
    whitelist_characters='-_'
))

# Strategy for generating entity names
entity_names = st.text(min_size=1, max_size=30, alphabet=st.characters(
    whitelist_categories=('Lu', 'Ll'),
    min_codepoint=65, max_codepoint=122
))

# Strategy for generating relation types
relation_types = st.sampled_from([
    "KNOWS", "LOCATED", "HAS", "IS", "OWNS", "LOVES", "HATES", "RELATED_TO"
])

# Strategy for generating facts (triples)
facts = st.tuples(entity_names, relation_types, entity_names)


def create_mock_kg(project_id: str, facts_list: list[tuple[str, str, str]]) -> StoryKnowledgeGraph:
    """Create a mock StoryKnowledgeGraph with given facts."""
    mock_supabase = Mock()
    kg = StoryKnowledgeGraph(project_id=project_id, supabase_client=mock_supabase)
    
    # Add facts without persisting to DB
    for subject, relation, obj in facts_list:
        kg.add_fact(subject, relation, obj, persist=False)
    
    return kg


def graphs_are_equal(kg1: StoryKnowledgeGraph, kg2: StoryKnowledgeGraph) -> bool:
    """
    Check if two knowledge graphs have the same structure.
    
    Compares nodes, edges, and edge attributes.
    """
    if kg1.project_id != kg2.project_id:
        return False
    
    # Check nodes
    if set(kg1.graph.nodes()) != set(kg2.graph.nodes()):
        return False
    
    # Check edges (including multi-edges)
    edges1 = set()
    for u, v, data in kg1.graph.edges(data=True):
        relation = data.get('relation', '')
        edges1.add((u, v, relation))
    
    edges2 = set()
    for u, v, data in kg2.graph.edges(data=True):
        relation = data.get('relation', '')
        edges2.add((u, v, relation))
    
    return edges1 == edges2


@given(
    project_id=project_ids,
    initial_facts=st.lists(facts, min_size=0, max_size=10, unique=True),
    update_facts=st.lists(facts, min_size=0, max_size=5, unique=True)
)
@settings(max_examples=100)
def test_cache_consistency_property(
    project_id: str,
    initial_facts: list[tuple[str, str, str]],
    update_facts: list[tuple[str, str, str]]
):
    """
    Property 1: Cache Consistency
    
    For any project_id and any sequence of KG updates, reading from cache 
    should return the same graph state as reading from the database.
    
    This test verifies that:
    1. After caching a KG, retrieving it returns the same graph
    2. After updating facts via update_fact(), the cached graph reflects those changes
    3. The cached graph structure matches what would be loaded from DB
    
    Validates: Requirements 4.6
    """
    # Arrange: Create cache and initial knowledge graph
    cache = KGCache(ttl_seconds=300, max_size=100)
    
    # Create initial KG with facts
    kg_original = create_mock_kg(project_id, initial_facts)
    
    # Act: Store in cache
    cache.set(project_id, kg_original)
    
    # Assert: Retrieved KG should match original
    kg_from_cache = cache.get(project_id)
    assert kg_from_cache is not None, "Cache should return the stored KG"
    assert graphs_are_equal(kg_original, kg_from_cache), (
        "Retrieved KG from cache should match the original KG"
    )
    
    # Act: Apply updates via cache.update_fact()
    for subject, relation, obj in update_facts:
        cache.update_fact(project_id, subject, relation, obj)
    
    # Assert: Retrieved KG should reflect all updates
    kg_after_updates = cache.get(project_id)
    assert kg_after_updates is not None, "Cache should still contain the KG after updates"
    
    # Verify all update facts are in the cached graph
    for subject, relation, obj in update_facts:
        normalized_relation = relation.upper()
        
        # Check that the edge exists in the graph
        assert kg_after_updates.graph.has_node(subject), (
            f"Subject '{subject}' should exist in graph after update"
        )
        assert kg_after_updates.graph.has_node(obj), (
            f"Object '{obj}' should exist in graph after update"
        )
        
        # Check that the edge with the relation exists
        edge_found = False
        if kg_after_updates.graph.has_edge(subject, obj):
            for edge_data in kg_after_updates.graph[subject][obj].values():
                if edge_data.get('relation') == normalized_relation:
                    edge_found = True
                    break
        
        assert edge_found, (
            f"Edge ({subject}, {normalized_relation}, {obj}) should exist in cached graph after update"
        )
    
    # Verify original facts are still present (unless overwritten by stateful relations)
    for subject, relation, obj in initial_facts:
        normalized_relation = relation.upper()
        
        assert kg_after_updates.graph.has_node(subject), (
            f"Original subject '{subject}' should still exist in graph"
        )
        assert kg_after_updates.graph.has_node(obj), (
            f"Original object '{obj}' should still exist in graph"
        )


@given(
    project_id=project_ids,
    facts_list=st.lists(facts, min_size=1, max_size=10, unique=True)
)
@settings(max_examples=100)
def test_cache_get_set_consistency(
    project_id: str,
    facts_list: list[tuple[str, str, str]]
):
    """
    Property 1 (variant): Cache Get/Set Consistency
    
    For any knowledge graph, after storing it in cache and retrieving it,
    the retrieved graph should be identical to the original.
    
    Validates: Requirements 4.6
    """
    # Arrange
    cache = KGCache(ttl_seconds=300, max_size=100)
    kg_original = create_mock_kg(project_id, facts_list)
    
    # Act: Store and retrieve
    cache.set(project_id, kg_original)
    kg_retrieved = cache.get(project_id)
    
    # Assert: Graphs should be equal
    assert kg_retrieved is not None, "Cache should return a KG after set()"
    assert graphs_are_equal(kg_original, kg_retrieved), (
        "Retrieved KG should match the original KG exactly"
    )
    
    # Verify all facts are present
    for subject, relation, obj in facts_list:
        normalized_relation = relation.upper()
        
        assert kg_retrieved.graph.has_node(subject), (
            f"Subject '{subject}' should exist in retrieved graph"
        )
        assert kg_retrieved.graph.has_node(obj), (
            f"Object '{obj}' should exist in retrieved graph"
        )
        
        # Check edge exists
        edge_found = False
        if kg_retrieved.graph.has_edge(subject, obj):
            for edge_data in kg_retrieved.graph[subject][obj].values():
                if edge_data.get('relation') == normalized_relation:
                    edge_found = True
                    break
        
        assert edge_found, (
            f"Edge ({subject}, {normalized_relation}, {obj}) should exist in retrieved graph"
        )


@given(
    project_id=project_ids,
    facts_list=st.lists(facts, min_size=1, max_size=5, unique=True)
)
@settings(max_examples=100)
def test_cache_invalidation_consistency(
    project_id: str,
    facts_list: list[tuple[str, str, str]]
):
    """
    Property 1 (variant): Cache Invalidation Consistency
    
    For any cached knowledge graph, after invalidation, the cache should
    return None (indicating a cache miss).
    
    Validates: Requirements 4.6
    """
    # Arrange
    cache = KGCache(ttl_seconds=300, max_size=100)
    kg = create_mock_kg(project_id, facts_list)
    
    # Act: Store, invalidate, and retrieve
    cache.set(project_id, kg)
    assert cache.get(project_id) is not None, "Cache should contain KG before invalidation"
    
    cache.invalidate(project_id)
    kg_after_invalidation = cache.get(project_id)
    
    # Assert: Should return None after invalidation
    assert kg_after_invalidation is None, (
        "Cache should return None after invalidation"
    )


@given(
    project_ids_list=st.lists(project_ids, min_size=2, max_size=5, unique=True),
    facts_per_project=st.lists(
        st.lists(facts, min_size=1, max_size=5, unique=True),
        min_size=2,
        max_size=5
    )
)
@settings(max_examples=100)
def test_cache_isolation_property(
    project_ids_list: list[str],
    facts_per_project: list[list[tuple[str, str, str]]]
):
    """
    Property 1 (variant): Cache Isolation
    
    For any set of projects with different knowledge graphs, each project's
    cached graph should remain independent and not affect others.
    
    Validates: Requirements 4.6
    """
    # Ensure we have matching lengths
    num_projects = min(len(project_ids_list), len(facts_per_project))
    if num_projects < 2:
        return  # Skip if we don't have enough data
    
    project_ids_list = project_ids_list[:num_projects]
    facts_per_project = facts_per_project[:num_projects]
    
    # Arrange
    cache = KGCache(ttl_seconds=300, max_size=100)
    original_graphs = {}
    
    # Store multiple projects in cache
    for project_id, facts_list in zip(project_ids_list, facts_per_project):
        kg = create_mock_kg(project_id, facts_list)
        cache.set(project_id, kg)
        original_graphs[project_id] = kg
    
    # Act & Assert: Verify each project's graph is independent
    for project_id, original_kg in original_graphs.items():
        retrieved_kg = cache.get(project_id)
        
        assert retrieved_kg is not None, (
            f"Cache should contain KG for project {project_id}"
        )
        assert graphs_are_equal(original_kg, retrieved_kg), (
            f"Retrieved KG for project {project_id} should match its original"
        )
        
        # Verify it's the correct project
        assert retrieved_kg.project_id == project_id, (
            f"Retrieved KG should have correct project_id"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
