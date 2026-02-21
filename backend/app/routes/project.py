from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

from services.project_setup import project_setup
from services.style_analysis import extract_text_from_pdf, analyze_writer_style
from lib.supabase import supabase_client

router = APIRouter(prefix="/projects", tags=["Projects"])


class CharacterInput(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = ""


class ProjectSetupRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    genre: str = ""
    perspective: str = "Third Person"
    tone: str = "Balanced"
    characters: list[CharacterInput] = Field(default_factory=list)
    world_setting: str = ""


@router.post("/setup")
# async def setup_story(data: dict):
async def setup_story(data: ProjectSetupRequest):
    # This matches the '🆕 Create Project — Story Memory Setup' in your vision
    if not data.characters:
        raise HTTPException(
            status_code=400, detail="At least one character is required."
        )

    try:
        project_id = await project_setup.create_new_story_brain(
            user_id=data.user_id,
            setup_data=data.model_dump(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not create project: {exc}")

    return {"status": "success", "project_id": project_id}


@router.post("/{project_id}/analyze-behavior")
async def analyze_behavior(project_id: str, file: UploadFile = File(...)):
    """Upload a PDF or TXT to extract the author's style blueprint."""
    try:
        content = await file.read()
        if file.content_type == "application/pdf":
            text = extract_text_from_pdf(content)
        else:
            text = content.decode("utf-8")

        if not text.strip():
            raise HTTPException(
                status_code=400, detail="The file is empty or unreadable."
            )

        # Run Heavy ML Analysis
        blueprint = analyze_writer_style(text)

        # Sync to DB
        supabase_client.table("projects").update({"style_blueprint": blueprint}).eq(
            "id", project_id
        ).execute()

        return {"status": "success", "blueprint": blueprint}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
