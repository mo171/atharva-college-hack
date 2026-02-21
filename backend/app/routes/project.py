from fastapi import APIRouter
from services.project_setup import project_setup

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/setup")
async def setup_story(data: dict):
    # This matches the '🆕 Create Project — Story Memory Setup' in your vision
    project_id = await project_setup.create_new_story_brain(
        user_id=data.get("user_id"), 
        setup_data=data
    )
    return {"status": "success", "project_id": project_id}