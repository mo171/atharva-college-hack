"""
Property-based tests for RAG service.

Feature: architecture-improvements, Property 2: RAG Relevance Threshold
Validates: Requirements 1.3
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from unittest.mock import Mock, MagicMock
from hypothesis import given, strategies as st, settings
import pytest

from services.rag import RAGService


# Strategy for generating similarity scores
similarity_scores = st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)

# Strategy for generating chunk data
def chunk_with_similarity(similarity: float) -> dict:
    """Generate a chunk dictionary with a given similarity score."""
    return {
        "content": f"Sample narrative content with similarity {similarity}",
        "similarity": similarity,
        "chunk_index": 0
    }


@given(
    threshold=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
    similarities=st.lists(
        st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
        min_size=0,
        max_size=10
    )
)
@settings(max_examples=100)
def test_rag_relevance_threshold_property(threshold: float, similarities: list[float]):
    """
    Property 2: RAG Relevance Threshold
    
    For any ghost text generation request, all retrieved chunks should have 
    similarity score >= threshold OR the system should fall back to sequential history.
    
    Validates: Requirements 1.3
    """
    # Arrange: Create mock Supabase client
    mock_supabase = Mock()
    mock_rpc_result = Mock()
    
    # Generate chunks with the given similarities
    mock_chunks = [chunk_with_similarity(sim) for sim in similarities]
    mock_rpc_result.data = mock_chunks
    mock_supabase.rpc.return_value.execute.return_value = mock_rpc_result
    
    # Mock the table query for fallback
    mock_table = Mock()
    mock_select = Mock()
    mock_eq = Mock()
    mock_order = Mock()
    mock_limit = Mock()
    mock_execute = Mock()
    
    fallback_chunks = [
        {"content": "Fallback chunk 1", "chunk_index": 2},
        {"content": "Fallback chunk 2", "chunk_index": 1},
        {"content": "Fallback chunk 3", "chunk_index": 0}
    ]
    mock_execute.data = fallback_chunks
    
    mock_limit.execute.return_value = mock_execute
    mock_order.limit.return_value = mock_limit
    mock_eq.order.return_value = mock_order
    mock_select.eq.return_value = mock_eq
    mock_table.select.return_value = mock_select
    mock_supabase.table.return_value = mock_table
    
    # Create RAG service with mocked client
    rag_service = RAGService(supabase_client=mock_supabase)
    
    # Mock get_embedding to avoid actual API calls
    import services.rag as rag_module
    original_get_embedding = rag_module.get_embedding
    rag_module.get_embedding = Mock(return_value=[0.1] * 1536)
    
    try:
        # Act: Retrieve chunks with the given threshold
        result = rag_service.retrieve_relevant_chunks(
            project_id="test-project",
            query_text="test query",
            top_k=3,
            threshold=threshold
        )
        
        # Assert: Check the property
        # Either all results meet the threshold, or we got fallback results
        if result:
            # Check if any chunk has similarity >= threshold
            has_relevant_chunks = any(chunk.get("similarity", 0) >= threshold for chunk in mock_chunks)
            
            if has_relevant_chunks:
                # If we have relevant chunks, all returned chunks should meet threshold
                for chunk in result:
                    similarity = chunk.get("similarity", 0.0)
                    # Allow for fallback chunks (similarity = 0.0) or chunks meeting threshold
                    assert similarity >= threshold or similarity == 0.0, (
                        f"Chunk with similarity {similarity} does not meet threshold {threshold} "
                        f"and is not a fallback chunk"
                    )
            else:
                # If no relevant chunks, we should have fallback results (similarity = 0.0)
                for chunk in result:
                    assert chunk.get("similarity", 0.0) == 0.0, (
                        f"Expected fallback chunks with similarity 0.0, got {chunk.get('similarity')}"
                    )
    finally:
        # Restore original function
        rag_module.get_embedding = original_get_embedding


@given(
    threshold=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
    num_above=st.integers(min_value=0, max_value=5),
    num_below=st.integers(min_value=0, max_value=5)
)
@settings(max_examples=100)
def test_rag_threshold_filtering_property(threshold: float, num_above: int, num_below: int):
    """
    Property 2 (variant): RAG Threshold Filtering
    
    For any threshold and any mix of chunks above/below threshold,
    the system should either return chunks >= threshold or fall back to sequential.
    
    Validates: Requirements 1.3
    """
    # Arrange: Create chunks with controlled similarities
    mock_supabase = Mock()
    mock_rpc_result = Mock()
    
    # Generate chunks above and below threshold
    chunks_above = [
        chunk_with_similarity(threshold + 0.1 + i * 0.05)
        for i in range(num_above)
    ]
    chunks_below = [
        chunk_with_similarity(max(0.0, threshold - 0.1 - i * 0.05))
        for i in range(num_below)
    ]
    
    all_chunks = chunks_above + chunks_below
    mock_rpc_result.data = all_chunks
    mock_supabase.rpc.return_value.execute.return_value = mock_rpc_result
    
    # Mock fallback
    mock_table = Mock()
    mock_select = Mock()
    mock_eq = Mock()
    mock_order = Mock()
    mock_limit = Mock()
    mock_execute = Mock()
    
    fallback_chunks = [
        {"content": "Fallback chunk", "chunk_index": i}
        for i in range(3)
    ]
    mock_execute.data = fallback_chunks
    
    mock_limit.execute.return_value = mock_execute
    mock_order.limit.return_value = mock_limit
    mock_eq.order.return_value = mock_order
    mock_select.eq.return_value = mock_eq
    mock_table.select.return_value = mock_select
    mock_supabase.table.return_value = mock_table
    
    # Create RAG service
    rag_service = RAGService(supabase_client=mock_supabase)
    
    # Mock get_embedding
    import services.rag as rag_module
    original_get_embedding = rag_module.get_embedding
    rag_module.get_embedding = Mock(return_value=[0.1] * 1536)
    
    try:
        # Act
        result = rag_service.retrieve_relevant_chunks(
            project_id="test-project",
            query_text="test query",
            top_k=10,
            threshold=threshold
        )
        
        # Assert: Property holds
        if num_above > 0:
            # If we have chunks above threshold, result should contain them
            # and all should meet threshold (or be fallback with 0.0)
            for chunk in result:
                sim = chunk.get("similarity", 0.0)
                assert sim >= threshold or sim == 0.0, (
                    f"Chunk similarity {sim} violates threshold {threshold}"
                )
        else:
            # If no chunks above threshold, should fall back to sequential (similarity = 0.0)
            for chunk in result:
                assert chunk.get("similarity", 0.0) == 0.0, (
                    f"Expected fallback with similarity 0.0, got {chunk.get('similarity')}"
                )
    finally:
        # Restore
        rag_module.get_embedding = original_get_embedding


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
