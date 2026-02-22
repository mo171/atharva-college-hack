"""Plot point extraction service using AI to analyze narrative chunks."""

from __future__ import annotations

import os
import json
from typing import Any, Dict, List, Optional

from openai import OpenAI
from supabase import Client

from lib.supabase import supabase_client as _default_supabase


class PlotExtractionService:
    """Extract plot points from narrative chunks using AI analysis."""

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is required for plot extraction.")
        self.client = OpenAI(api_key=self.api_key)
        self.model = model

    def extract_plot_points_from_chunks(
        self,
        project_id: str,
        narrative_chunks: List[Dict[str, Any]],
        entities: List[Dict[str, Any]],
        supabase_client: Client | None = None,
    ) -> Dict[str, Any]:
        """
        Extract plot points from narrative chunks using AI.
        
        Args:
            project_id: Project ID
            narrative_chunks: List of narrative chunk dicts with id, content, chunk_index
            entities: List of entity dicts with id, name, entity_type
            supabase_client: Optional Supabase client
            
        Returns:
            Dict with plot_threads and plot_points
        """
        if not narrative_chunks:
            return {"plot_threads": [], "plot_points": []}

        supabase = supabase_client or _default_supabase

        # Get character names for context
        character_names = [
            e["name"]
            for e in entities
            if e.get("entity_type") == "CHARACTER"
        ]

        # Build context for LLM
        chunks_text = "\n\n".join(
            [
                f"[Chunk {chunk.get('chunk_index', i)}]: {chunk.get('content', '')}"
                for i, chunk in enumerate(narrative_chunks)
            ]
        )

        characters_text = ", ".join(character_names) if character_names else "None"

        prompt = f"""You are analyzing a story to extract key plot points and events. 

CHARACTERS IN STORY:
{characters_text}

STORY CONTENT (in chronological order):
{chunks_text[:8000]}  # Limit to avoid token limits

TASK:
Extract key plot points from this story. For each significant event, identify:
1. A brief title (3-8 words)
2. A description (1-2 sentences)
3. Event type (ACTION, DIALOGUE, DISCOVERY, CONFLICT, RESOLUTION, TRANSITION, OTHER)
4. Which characters are involved (from the list above)
5. Timeline position (based on chunk order)
6. Cause-effect relationships between events

Return a JSON object with a "plot_points" array in this exact format:
{{
  "plot_points": [
    {{
      "title": "Event title",
      "description": "What happens",
      "event_type": "ACTION",
      "timeline_position": 1,
      "chunk_index": 0,
      "characters": ["Character Name 1", "Character Name 2"],
      "causes": [],
      "follows": []
    }}
  ]
}}

Rules:
- Only extract significant events (not every sentence)
- Group related events that happen in the same chunk
- Maintain chronological order
- Identify clear cause-effect relationships
- Include character involvement accurately
- Return valid JSON only, no markdown or extra text"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a story analysis expert. Extract plot points and return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            result_text = response.choices[0].message.content or "{}"
            result = json.loads(result_text)

            plot_points_data = result.get("plot_points", [])

            # Create default plot thread if none exists
            thread_resp = (
                supabase.table("plot_threads")
                .select("id")
                .eq("project_id", project_id)
                .limit(1)
                .execute()
            )

            if not thread_resp.data:
                thread_resp = (
                    supabase.table("plot_threads")
                    .insert(
                        {
                            "project_id": project_id,
                            "title": "Main Plot",
                            "description": "Primary storyline",
                            "color": "#5a5fd8",
                        }
                    )
                    .execute()
                )
                thread_id = thread_resp.data[0]["id"]
            else:
                thread_id = thread_resp.data[0]["id"]

            # Map chunk IDs by index
            chunk_map = {
                chunk.get("chunk_index", i): chunk.get("id")
                for i, chunk in enumerate(narrative_chunks)
            }

            # Map entity names to IDs
            entity_map = {e["name"]: e["id"] for e in entities}

            # Store plot points
            created_points = []
            point_id_map = {}  # Map timeline_position to created point ID

            for i, point_data in enumerate(plot_points_data):
                chunk_index = point_data.get("chunk_index", i)
                narrative_chunk_id = chunk_map.get(chunk_index)

                # Create plot point
                point_resp = (
                    supabase.table("plot_points")
                    .insert(
                        {
                            "plot_thread_id": thread_id,
                            "project_id": project_id,
                            "title": point_data.get("title", f"Event {i+1}"),
                            "description": point_data.get("description", ""),
                            "event_type": point_data.get("event_type", "OTHER"),
                            "timeline_position": point_data.get("timeline_position", i + 1),
                            "narrative_chunk_id": narrative_chunk_id,
                            "position_x": (i % 5) * 250,  # Simple grid layout
                            "position_y": (i // 5) * 200,
                        }
                    )
                    .execute()
                )

                point_id = point_resp.data[0]["id"]
                timeline_pos = point_data.get("timeline_position", i + 1)
                point_id_map[timeline_pos] = point_id
                created_points.append(point_id)

                # Link characters
                character_names_in_point = point_data.get("characters", [])
                for char_name in character_names_in_point:
                    entity_id = entity_map.get(char_name)
                    if entity_id:
                        supabase.table("plot_point_characters").insert(
                            {
                                "plot_point_id": point_id,
                                "entity_id": entity_id,
                                "role": "PRIMARY" if char_name == character_names_in_point[0] else "SECONDARY",
                                "importance": "PRIMARY" if len(character_names_in_point) == 1 else "SECONDARY",
                            }
                        ).execute()

            # Create connections - automatically connect nodes sequentially
            # Sort points by timeline_position to ensure proper order
            sorted_positions = sorted(point_id_map.keys())
            
            # Create automatic sequential connections (like n8n)
            for i in range(len(sorted_positions) - 1):
                current_pos = sorted_positions[i]
                next_pos = sorted_positions[i + 1]
                
                from_point_id = point_id_map.get(current_pos)
                to_point_id = point_id_map.get(next_pos)
                
                if from_point_id and to_point_id:
                    try:
                        # Check if connection already exists
                        existing = (
                            supabase.table("plot_point_connections")
                            .select("id")
                            .eq("from_point_id", from_point_id)
                            .eq("to_point_id", to_point_id)
                            .execute()
                        )
                        
                        if not existing.data:
                            supabase.table("plot_point_connections").insert(
                                {
                                    "from_point_id": from_point_id,
                                    "to_point_id": to_point_id,
                                    "connection_type": "FOLLOWS",
                                }
                            ).execute()
                    except Exception:
                        pass  # Connection might already exist

            # Also handle explicit "follows" and "causes" relationships from AI
            for i, point_data in enumerate(plot_points_data):
                timeline_pos = point_data.get("timeline_position", i + 1)
                current_point_id = point_id_map.get(timeline_pos)

                if not current_point_id:
                    continue

                # Handle explicit "follows" relationships (if not already connected)
                follows = point_data.get("follows", [])
                for follow_pos in follows:
                    from_point_id = point_id_map.get(follow_pos)
                    if from_point_id and from_point_id != current_point_id:
                        try:
                            # Check if connection already exists
                            existing = (
                                supabase.table("plot_point_connections")
                                .select("id")
                                .eq("from_point_id", from_point_id)
                                .eq("to_point_id", current_point_id)
                                .execute()
                            )
                            
                            if not existing.data:
                                supabase.table("plot_point_connections").insert(
                                    {
                                        "from_point_id": from_point_id,
                                        "to_point_id": current_point_id,
                                        "connection_type": "FOLLOWS",
                                    }
                                ).execute()
                        except Exception:
                            pass  # Connection might already exist

                # Handle "causes" relationships
                causes = point_data.get("causes", [])
                for cause_pos in causes:
                    to_point_id = point_id_map.get(cause_pos)
                    if to_point_id and to_point_id != current_point_id:
                        try:
                            # Check if connection already exists
                            existing = (
                                supabase.table("plot_point_connections")
                                .select("id")
                                .eq("from_point_id", current_point_id)
                                .eq("to_point_id", to_point_id)
                                .execute()
                            )
                            
                            if not existing.data:
                                supabase.table("plot_point_connections").insert(
                                    {
                                        "from_point_id": current_point_id,
                                        "to_point_id": to_point_id,
                                        "connection_type": "CAUSES",
                                    }
                                ).execute()
                        except Exception:
                            pass

            return {
                "status": "success",
                "plot_points_created": len(created_points),
                "thread_id": thread_id,
            }

        except Exception as e:
            print(f"Plot extraction error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "error": str(e),
                "plot_points_created": 0,
            }


def get_plot_extraction_service() -> PlotExtractionService:
    """Get singleton instance of PlotExtractionService."""
    global _plot_extraction_service
    if _plot_extraction_service is None:
        _plot_extraction_service = PlotExtractionService()
    return _plot_extraction_service


_plot_extraction_service: PlotExtractionService | None = None
