"""Character persona and story summary generation with real-time updates."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI
from supabase import Client

from lib.supabase import supabase_client as _default_supabase
from services.llm_gateway import get_embedding


def _gather_character_context(
    project_id: str,
    entity_id: str,
    entity_name: str,
    supabase: Client,
) -> tuple[list[str], list[str]]:
    """
    Gather narrative snippets and relationship facts for a character.
    Returns (narrative_snippets, relationship_facts).
    """
    # 1. Fetch relationships for this entity (both directions)
    rel_as_a = (
        supabase.table("relationships")
        .select("entity_a_id, entity_b_id, relation_type, description")
        .eq("project_id", project_id)
        .eq("entity_a_id", entity_id)
        .execute()
    )
    rel_as_b = (
        supabase.table("relationships")
        .select("entity_a_id, entity_b_id, relation_type, description")
        .eq("project_id", project_id)
        .eq("entity_b_id", entity_id)
        .execute()
    )

    # Build id->name map for other entities
    other_ids: set[str] = set()
    for row in (rel_as_a.data or []) + (rel_as_b.data or []):
        other_ids.add(row.get("entity_a_id"))
        other_ids.add(row.get("entity_b_id"))
    other_ids.discard(entity_id)

    id_to_name: dict[str, str] = {}
    if other_ids:
        entities_resp = (
            supabase.table("entities")
            .select("id, name")
            .in_("id", list(other_ids))
            .execute()
        )
        for row in entities_resp.data or []:
            id_to_name[row["id"]] = row["name"]

    relationship_facts: list[str] = []
    for row in rel_as_a.data or []:
        other_id = row.get("entity_b_id")
        other_name = id_to_name.get(other_id, "unknown")
        rel = (row.get("relation_type") or "RELATED_TO").upper()
        desc = row.get("description") or ""
        fact = f"{entity_name} -- {rel} --> {other_name}"
        if desc:
            fact += f" ({desc})"
        relationship_facts.append(fact)

    for row in rel_as_b.data or []:
        other_id = row.get("entity_a_id")
        other_name = id_to_name.get(other_id, "unknown")
        rel = (row.get("relation_type") or "RELATED_TO").upper()
        desc = row.get("description") or ""
        fact = f"{other_name} -- {rel} --> {entity_name}"
        if desc:
            fact += f" ({desc})"
        relationship_facts.append(fact)

    # 2. Vector search for narrative chunks about this character
    query_text = (
        f"Story events, actions, and descriptions involving the character {entity_name}."
    )
    try:
        query_embedding = get_embedding(query_text)
    except Exception:
        return ([], relationship_facts)

    try:
        rpc_result = supabase.rpc(
            "match_narrative_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.3,
                "match_count": 10,
                "p_project_id": project_id,
            },
        ).execute()
    except Exception:
        return ([], relationship_facts)

    narrative_snippets = [
        row["content"] for row in (rpc_result.data or []) if row.get("content")
    ]
    return (narrative_snippets, relationship_facts)


def _generate_character_summary(
    name: str,
    narrative_snippets: list[str],
    relationship_facts: list[str],
    api_key: str | None = None,
    model: str = "gpt-4o-mini",
) -> tuple[str, str]:
    """
    Generate persona_summary and story_summary via LLM.
    Returns (persona_summary, story_summary).
    """
    key = api_key or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is required for character summary generation.")

    narrative_block = "\n\n".join(narrative_snippets) if narrative_snippets else "(No story content yet.)"
    facts_block = "\n".join(relationship_facts) if relationship_facts else "(No relationship facts yet.)"

    prompt = f"""You are an editorial assistant for fiction writers. Given story content and relationship facts about a character, produce two short summaries.

Character: {name}

--- NARRATIVE EXCERPTS (story chunks mentioning or involving this character) ---
{narrative_block}

--- RELATIONSHIP FACTS (knowledge graph) ---
{facts_block}

--- YOUR TASK ---
Output exactly two sections, using these exact headers (copy them precisely):

## PERSONA
Write 2-4 sentences describing who this character is: their traits, role, how they are described, their personality. Use only information from the excerpts and facts above.

## STORY SO FAR
Write 2-4 sentences summarizing what this character has done or experienced in the story. If there is no story content yet, write "No story events recorded yet."

Output only the two sections with headers. No other text."""

    client = OpenAI(api_key=key)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    text = (response.choices[0].message.content or "").strip()

    persona_summary = ""
    story_summary = ""

    if "## PERSONA" in text and "## STORY SO FAR" in text:
        parts = text.split("## STORY SO FAR", 1)
        persona_part = parts[0].replace("## PERSONA", "").strip()
        story_part = parts[1].strip() if len(parts) > 1 else ""
        persona_summary = persona_part
        story_summary = story_part
    elif "## PERSONA" in text:
        persona_summary = text.replace("## PERSONA", "").strip()
        story_summary = "No story events recorded yet."
    else:
        persona_summary = text[:500] if text else "No persona information yet."
        story_summary = "No story events recorded yet."

    return (persona_summary, story_summary)


def update_character_summary(
    project_id: str,
    entity_id: str,
    supabase_client: Client | None = None,
    api_key: str | None = None,
) -> dict[str, Any] | None:
    """
    Gather context for a character, generate persona and story summaries via LLM,
    and persist them in the entity's metadata. Only runs for CHARACTER entities.
    Returns the updated metadata dict, or None if skipped/failed.
    """
    supabase = supabase_client or _default_supabase

    entity_resp = (
        supabase.table("entities")
        .select("id, name, entity_type, metadata")
        .eq("id", entity_id)
        .eq("project_id", project_id)
        .limit(1)
        .execute()
    )
    rows = entity_resp.data or []
    if not rows:
        return None

    row = rows[0]
    if row.get("entity_type") != "CHARACTER":
        return None

    name = row.get("name") or "Unknown"
    existing_metadata: dict[str, Any] = dict(row.get("metadata") or {})

    narrative_snippets, relationship_facts = _gather_character_context(
        project_id=project_id,
        entity_id=entity_id,
        entity_name=name,
        supabase=supabase,
    )

    persona_summary, story_summary = _generate_character_summary(
        name=name,
        narrative_snippets=narrative_snippets,
        relationship_facts=relationship_facts,
        api_key=api_key,
    )

    updated_metadata = {
        **existing_metadata,
        "persona_summary": persona_summary,
        "story_summary": story_summary,
        "summary_updated_at": datetime.now(timezone.utc).isoformat(),
    }

    supabase.table("entities").update({"metadata": updated_metadata}).eq(
        "id", entity_id
    ).execute()

    return updated_metadata
