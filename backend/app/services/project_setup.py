from app.lib.supabase import supabase_client
from app.services.llm_gateway import llm # For initial embeddings

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
        
        project_id = project.data[0]['id']

        # 2. Seed the Characters (Entities)
        # setup_data['characters'] = [{"name": "John", "description": "A weary knight"}]
        for char in setup_data.get("characters", []):
            supabase_client.table("entities").insert({
                "project_id": project_id,
                "name": char["name"],
                "entity_type": "CHARACTER",
                "description": char["description"],
                "metadata": {"status": "alive", "inventory": []},
                "is_initial_setup": True
            }).execute()

        # 3. Create the 'World Foundation' in Vector Memory
        # This ensures the AI remembers the setting (e.g., 'The story takes place in a floating city')
        world_desc = setup_data.get("world_setting", "")
        if world_desc:
            supabase_client.table("narrative_chunks").insert({
                "project_id": project_id,
                "content": f"WORLD SETTING: {world_desc}",
                "embedding": llm.get_embedding(world_desc)
            }).execute()

        return project_id

project_setup = ProjectSetupService()