from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.project_setup import project_setup

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
async def setup_story(data: ProjectSetupRequest):
    # This matches the '🆕 Create Project — Story Memory Setup' in your vision
    if not data.characters:
        raise HTTPException(status_code=400, detail="At least one character is required.")

    try:
        project_id = await project_setup.create_new_story_brain(
            user_id=data.user_id,
            setup_data=data.model_dump(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not create project: {exc}")

    return {"status": "success", "project_id": project_id}
