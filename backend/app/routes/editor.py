from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from lib.supabase import supabase_client
from services.analysis import StoryKnowledgeGraph
from services.extraction import (
    ENTITY_LABEL_MAP,
    ExtractionStore,
    # build_nlp_pipeline,
    get_cached_nlp_pipeline,
    run_core_nlp_pipeline,
)
from services.llm_gateway import get_embedding, SupabaseInsightService
from services.character_summary import update_character_summary
from services.correction import get_correction_suite

router = APIRouter(prefix="/editor", tags=["Narrative Editor"])

# --- REQUEST/RESPONSE MODELS ---


class WriteRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    content: str = Field(
        ..., min_length=1, example="John walked into the room. He was angry."
    )


class SaveRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    content: str = Field(..., example="Draft content...")


class EntityResponse(BaseModel):
    name: str


class AlertResponse(BaseModel):
    type: str  # e.g., 'INCONSISTENCY', 'POV_SHIFT'
    entity: Optional[str]
    explanation: str
    original_text: Optional[str] = None


class AnalysisResponse(BaseModel):
    status: str
    entities: List[EntityResponse]
    alerts: List[AlertResponse]
    resolved_context: str
    detected_actions: List[Dict[str, Any]]


# --- SHARED ANALYSIS LOGIC ---


async def run_analysis(project_id: str, text_content: str) -> dict:
    """
    Run the full analysis pipeline: extraction, persistence, KG update, insight generation.
    Returns the same dict shape as AnalysisResponse for use by HTTP and WebSocket routes.
    """
    nlp = get_cached_nlp_pipeline(model_name="en_core_web_sm", enable_coref=False)
    result = run_core_nlp_pipeline(text_content, nlp)

    embedding = None
    try:
        embedding = get_embedding(result.normalized_text)
    except Exception:
        pass

    store = ExtractionStore(project_id=project_id, supabase_client=supabase_client)
    store.upsert_entities(result.entities)
    store.insert_narrative_chunk(content=result.normalized_text, embedding=embedding)

    kg = StoryKnowledgeGraph.from_supabase(
        project_id=project_id, supabase_client=supabase_client
    )
    kg.apply_svo_triples(result.triples, persist=True, original_text=text_content)

    insight_service = SupabaseInsightService(project_id=project_id)
    alerts_data = insight_service.process_pending_logs()

    # Update character persona/story summaries for CHARACTERs in this chunk (real-time)
    character_names = [
        e["text"].strip()
        for e in result.entities
        if e["text"].strip()
        and ENTITY_LABEL_MAP.get(e.get("label", ""), "OBJECT") == "CHARACTER"
    ]
    unique_character_names = list(set(character_names))
    if unique_character_names:
        char_entities = (
            supabase_client.table("entities")
            .select("id")
            .eq("project_id", project_id)
            .eq("entity_type", "CHARACTER")
            .in_("name", unique_character_names[:5])
            .execute()
        )
        for row in char_entities.data or []:
            try:
                update_character_summary(
                    project_id=project_id,
                    entity_id=row["id"],
                    supabase_client=supabase_client,
                )
            except Exception:
                pass

    entities_out = [
        {"name": e["text"], "type": e.get("label", "OBJECT")} for e in result.entities
    ]
    alerts_out = [
        {
            "type": "INCONSISTENCY",
            "entity": None,
            "explanation": item["alert"],
            "original_text": item.get("original_text"),
        }
        for item in alerts_data
    ]

    # --- MICRO (THE POLISH) ---
    correction_suite = get_correction_suite()
    polish_alerts = correction_suite.analyze_polish(text_content)
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
        "detected_actions": detected_actions,
    }


# --- ROUTES ---


@router.post("/save")
async def save_draft(request: SaveRequest):
    """
    Saves narrative chunk immediately for persistence without
    triggering NLP analysis.
    """
    try:
        content = request.content
        project_id = request.project_id

        embedding = None
        try:
            embedding = get_embedding(content)
        except Exception:
            pass

        store = ExtractionStore(project_id=project_id, supabase_client=supabase_client)
        store.insert_narrative_chunk(content=content, embedding=embedding)

        return {"status": "saved", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_writing(request: WriteRequest):
    """
    Manual trigger for full narrative analysis.
    Runs extraction, persists KG/entities, and returns alerts/entities.
    """
    try:
        return await run_analysis(
            project_id=request.project_id, text_content=request.content
        )
    except Exception as e:
        print(f"CRITICAL ERROR in /editor/analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Narrative Engine Error: {str(e)}")


@router.get("/story-brain/{project_id}")
async def fetch_story_brain(project_id: str):
    """
    Populates the Left Panel (Story Brain) with the current
    state of characters and world facts.
    """
    try:
        # Fetch entities and their current JSONB metadata
        entities = (
            supabase_client.table("entities")
            .select("id, name, entity_type, description, metadata")
            .eq("project_id", project_id)
            .execute()
        )

        # Fetch timeline/history chunks
        history = (
            supabase_client.table("narrative_chunks")
            .select("content, created_at")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )

        return {"entities": entities.data, "recent_history": history.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not load Story Brain state.")


class RefreshCharacterSummaryRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    entity_id: str = Field(..., example="uuid-456-entity")


@router.post("/refresh-character-summary")
async def refresh_character_summary(request: RefreshCharacterSummaryRequest):
    """
    Refresh persona and story summary for a single character on demand.
    Useful when the user opens a character detail view or clicks Refresh.
    """
    try:
        updated = update_character_summary(
            project_id=request.project_id,
            entity_id=request.entity_id,
            supabase_client=supabase_client,
        )
        if updated is None:
            raise HTTPException(
                status_code=404,
                detail="Entity not found or is not a CHARACTER.",
            )
        return {"status": "success", "metadata": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not refresh character summary: {str(e)}",
        )


@router.post("/update-entity")
async def manual_entity_update(entity_id: str, metadata_patch: Dict[str, Any]):
    """
    Allows the user to manually override the 'Brain'
    (e.g., manually changing a character's status).
    """
    res = (
        supabase_client.table("entities")
        .update({"metadata": metadata_patch})
        .eq("id", entity_id)
        .execute()
    )
    return {"status": "updated", "data": res.data}
