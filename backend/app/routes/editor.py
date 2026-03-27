from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from lib.supabase import supabase_client
from services.analysis import StoryKnowledgeGraph
from services.analysis_orchestrator import AnalysisOrchestrator
from services.kg_cache import get_kg_cache
from services.correction import get_correction_suite
from services.suggestion import get_suggestion_service

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


class SuggestionRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    content: str = Field(..., example="Current story text context...")


class GenerateSuggestionsRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    content: str = Field(..., example="Current story text...")


class GrammarSuggestionRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    content: str = Field(..., example="Current story text...")
    alert: Dict[str, Any] = Field(
        ..., example={"type": "GRAMMAR", "original_text": "...", "explanation": "..."}
    )


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


# --- ROUTES ---


@router.post("/save")
async def save_draft(request: SaveRequest):
    """
    Saves narrative chunk immediately for persistence with lightweight analysis.
    Uses the analysis orchestrator in auto_save mode.
    """
    try:
        orchestrator = AnalysisOrchestrator(supabase_client=supabase_client)
        result = await orchestrator.process_content(
            project_id=request.project_id,
            content=request.content,
            mode="auto_save"
        )
        
        return {
            "status": result.get("status", "saved"),
            "project_id": request.project_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_writing(request: WriteRequest):
    """
    Manual trigger for full narrative analysis.
    Uses the analysis orchestrator in manual_analyze mode.
    """
    try:
        orchestrator = AnalysisOrchestrator(supabase_client=supabase_client)
        result = await orchestrator.process_content(
            project_id=request.project_id,
            content=request.content,
            mode="manual_analyze"
        )
        
        return result
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


@router.post("/suggest")
async def get_editing_suggestion(request: SuggestionRequest):
    """
    Generate a Ghost Text suggestion based on context, style,
    narrative history, and knowledge graph facts.
    """
    try:
        kg_cache = get_kg_cache()
        
        # 1. Fetch style blueprint
        project = (
            supabase_client.table("projects")
            .select("style_blueprint")
            .eq("id", request.project_id)
            .single()
            .execute()
        )
        blueprint = project.data.get("style_blueprint") if project.data else {}

        # 2. Fetch Narrative History (last 3 chunks)
        history_resp = (
            supabase_client.table("narrative_chunks")
            .select("content")
            .eq("project_id", request.project_id)
            .order("chunk_index", desc=True)
            .limit(3)
            .execute()
        )
        history = [row["content"] for row in reversed(history_resp.data or [])]

        # 3. Fetch Knowledge Graph Facts (relationships) using cache
        kg = kg_cache.get(request.project_id)
        if kg is None:
            kg = StoryKnowledgeGraph.from_supabase(
                project_id=request.project_id, supabase_client=supabase_client
            )
            kg_cache.set(request.project_id, kg)
        
        graph_facts = []
        for u, v, data in kg.graph.edges(data=True):
            graph_facts.append(f"{u} {data.get('relation', 'is related to')} {v}")

        # 4. Get suggestion with project_id for RAG and POV/tone
        service = get_suggestion_service()
        suggestion = service.get_ghost_suggestion(
            context_text=request.content,
            blueprint=blueprint,
            project_id=request.project_id,  # NEW: Pass project_id
            history=history,
            graph_facts=graph_facts[:15],  # Limit to avoid token bloat
        )

        return {"status": "success", "suggestion": suggestion}
    except Exception as e:
        print(f"Graph-Aware Ghost Text Error: {e}")
        return {"status": "error", "suggestion": ""}


@router.post("/generate-suggestions")
async def generate_suggestions(request: GenerateSuggestionsRequest):
    """
    Generate a suggested version of the text by applying all AI insights.
    Returns both original and suggested text for side-by-side comparison.
    """
    try:
        content = request.content

        # Fetch alerts by running analysis using orchestrator
        orchestrator = AnalysisOrchestrator(supabase_client=supabase_client)
        analysis_result = await orchestrator.process_content(
            project_id=request.project_id,
            content=content,
            mode="manual_analyze"
        )
        alerts = analysis_result.get("alerts", [])

        # Convert to dict format if needed
        alerts_dict = []
        for alert in alerts:
            if isinstance(alert, dict):
                alerts_dict.append(alert)
            else:
                alerts_dict.append(
                    {
                        "type": getattr(alert, "type", "UNKNOWN"),
                        "entity": getattr(alert, "entity", None),
                        "explanation": getattr(alert, "explanation", ""),
                        "original_text": getattr(alert, "original_text", None),
                    }
                )

        # Generate corrected text using correction suite
        correction_suite = get_correction_suite()
        suggested_text = correction_suite.generate_corrected_text(content, alerts_dict)

        return {
            "status": "success",
            "original_text": content,
            "suggested_text": suggested_text,
            "alerts_applied": len(alerts_dict),
        }
    except Exception as e:
        print(f"Generate Suggestions Error: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to generate suggestions: {str(e)}"
        )


@router.post("/get-grammar-suggestion")
async def get_grammar_suggestion(request: GrammarSuggestionRequest):
    """
    Get a grammar suggestion for a specific alert.
    Returns suggested alternative text/sentence.
    """
    try:
        correction_suite = get_correction_suite()
        alert = request.alert

        # Extract original text from alert
        original_text = alert.get("original_text", "")
        explanation = alert.get("explanation", "")

        if not original_text:
            raise ValueError("Alert must contain original_text")

        # Use LLM to generate grammar suggestion
        prompt = (
            f"You are a professional copyeditor. The following text has a grammar issue:\n\n"
            f"Issue: {explanation}\n\n"
            f"Original text: {original_text}\n\n"
            f"Provide a corrected version of this text. Return ONLY the corrected text, "
            f"maintaining the same meaning and style. Do not add explanations or markdown.\n\n"
            f"Corrected text:"
        )

        response = correction_suite.generator.client.chat.completions.create(
            model=correction_suite.generator.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )

        suggested_text = (response.choices[0].message.content or original_text).strip()

        return {
            "status": "success",
            "original_text": original_text,
            "suggested_text": suggested_text,
            "explanation": explanation,
        }
    except Exception as e:
        print(f"Get Grammar Suggestion Error: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to get grammar suggestion: {str(e)}"
        )
