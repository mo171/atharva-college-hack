from app.services.extraction import get_extracted_data, ExtractionResult
from app.services.llm_gateway import LLMGateway
from app.lib.supabase import supabase_client
import os

llm = LLMGateway(api_key=os.getenv("OPENAI_API_KEY"))

class NarrativeOrchestrator:
    async def process_text_block(self, project_id: str, text_content: str):
        # 1. Run the Enhanced Pipeline (AI/ML Lead's code)
        # Returns normalized_text, entities, and triples
        result: ExtractionResult = get_extracted_data(text_content)
        
        # 2. Update the 'Knowledge Base' (Entities Table)
        # We loop through triples to find state changes (e.g., John HAS Key)
        for triple in result.triples:
            if triple.relation in ["HAS", "HOLDS", "OWNS"]:
                # Logic: Update John's inventory in the metadata JSONB
                self._update_entity_inventory(project_id, triple.subject, triple.object)

        # 3. Conflict Detection Logic
        alerts = []
        for entity in result.entities:
            # Check Supabase for the entity's current status
            db_res = supabase_client.table("entities")\
                .select("metadata")\
                .eq("project_id", project_id)\
                .eq("name", entity["text"]).execute()
            
            if db_res.data:
                status = db_res.data[0]['metadata'].get('status')
                # Custom Rule: Dead characters shouldn't be performing actions
                if status == "dead":
                    explanation = llm.explain_inconsistency(
                        context=f"{entity['text']} is marked as dead in the story memory.",
                        current_text=text_content,
                        violation_type="Post-Mortem Action"
                    )
                    alerts.append({
                        "type": "INCONSISTENCY",
                        "entity": entity["text"],
                        "explanation": explanation
                    })

        # 4. Store the 'Normalized' (Pronoun-free) text for future memory
        supabase_client.table("narrative_chunks").insert({
            "project_id": project_id,
            "content": result.normalized_text,
            "embedding": llm.get_embedding(result.normalized_text)
        }).execute()

        return {
            "entities": result.entities,
            "alerts": alerts,
            "normalized_text": result.normalized_text
        }

    def _update_entity_inventory(self, project_id, owner_name, item_name):
        # Backend utility to update Supabase JSONB metadata
        # This is where the 'System Design' happens!
        supabase_client.rpc('update_character_inventory', {
            'p_project_id': project_id,
            'p_character_name': owner_name,
            'p_item': item_name
        }).execute()

orchestrator = NarrativeOrchestrator()