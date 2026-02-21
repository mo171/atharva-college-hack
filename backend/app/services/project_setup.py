from lib.supabase import supabase_client
from services.llm_gateway import get_embedding


class ProjectSetupService:
    async def create_new_story_brain(self, user_id: str, setup_data: dict):
        # 1. Create the Project
        project = supabase_client.table("projects").insert({
            "user_id": user_id,
            "title": setup_data.get("title"),
            "genre": setup_data.get("genre"),
            "target_pov": setup_data.get("perspective"),
            "tone_intention": setup_data.get("tone")
        }).execute()

        project_id = project.data[0]["id"]

        # 2. Seed the Characters (Entities)
        for char in setup_data.get("characters", []):
            supabase_client.table("entities").insert({
                "project_id": project_id,
                "name": char["name"],
                "entity_type": "CHARACTER",
                "description": char["description"],
                "metadata": {"status": "alive", "inventory": []},
                "is_initial_setup": True
            }).execute()

        # 3. World foundation chunk (chunk_index 0; optional embedding)
        world_desc = setup_data.get("world_setting", "")
        if world_desc:
            payload = {
                "project_id": project_id,
                "content": f"WORLD SETTING: {world_desc}",
                "chunk_index": 0,
            }
            try:
                payload["embedding"] = get_embedding(world_desc)
            except Exception:
                pass
            supabase_client.table("narrative_chunks").insert(payload).execute()

        return project_id

project_setup = ProjectSetupService()