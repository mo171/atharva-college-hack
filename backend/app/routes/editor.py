from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.analysis import orchestrator
from app.lib.supabase import supabase_client

router = APIRouter(prefix="/editor", tags=["Narrative Editor"])

# --- REQUEST/RESPONSE MODELS ---

class WriteRequest(BaseModel):
    project_id: str = Field(..., example="uuid-123-project")
    content: str = Field(..., min_length=1, example="John walked into the room. He was angry.")

class EntityResponse(BaseModel):
    name: str
    type: str

class AlertResponse(BaseModel):
    type: str  # e.g., 'INCONSISTENCY', 'POV_SHIFT'
    entity: Optional[str]
    explanation: str

class AnalysisResponse(BaseModel):
    status: str
    entities: List[EntityResponse]
    alerts: List[AlertResponse]
    resolved_context: str
    detected_actions: List[Dict[str, Any]]

# --- ROUTES ---

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_writing(request: WriteRequest):
    """
    The heart of the app. Receives text, runs the NLP pipeline, 
    checks DB consistency, and returns intelligent insights.
    """
    try:
        # Trigger the Orchestrator (Logic + DB + LLM)
        result = await orchestrator.process_text_block(
            project_id=request.project_id, 
            text_content=request.content
        )
        
        return {
            "status": "success",
            "entities": result.get("entities", []),
            "alerts": result.get("alerts", []),
            "resolved_context": result.get("normalized_text", ""),
            "detected_actions": result.get("triples", [])
        }
    except Exception as e:
        # Crucial for Hackathons: provide clear logs for the team to debug
        print(f"CRITICAL ERROR in /editor/analyze: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Narrative Engine Error: {str(e)}"
        )

@router.get("/story-brain/{project_id}")
async def fetch_story_brain(project_id: str):
    """
    Populates the Left Panel (Story Brain) with the current 
    state of characters and world facts.
    """
    try:
        # Fetch entities and their current JSONB metadata
        entities = supabase_client.table("entities")\
            .select("id, name, entity_type, metadata")\
            .eq("project_id", project_id).execute()
        
        # Fetch timeline/history chunks
        history = supabase_client.table("narrative_chunks")\
            .select("content, created_at")\
            .eq("project_id", project_id)\
            .order("created_at", desc=True)\
            .limit(10).execute()

        return {
            "entities": entities.data,
            "recent_history": history.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not load Story Brain state.")

@router.post("/update-entity")
async def manual_entity_update(entity_id: str, metadata_patch: Dict[str, Any]):
    """
    Allows the user to manually override the 'Brain' 
    (e.g., manually changing a character's status).
    """
    res = supabase_client.table("entities")\
        .update({"metadata": metadata_patch})\
        .eq("id", entity_id).execute()
    return {"status": "updated", "data": res.data}  