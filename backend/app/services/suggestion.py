from openai import OpenAI
import os
import re
from typing import Optional

from lib.supabase import supabase_client as _default_supabase
from services.rag import RAGService


class SuggestionService:
    def __init__(self, api_key: str = None, supabase_client=None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)
        self.supabase = supabase_client or _default_supabase
        self.rag_service = RAGService(supabase_client=self.supabase)

    def get_ghost_suggestion(
        self,
        context_text: str,
        blueprint: dict,
        project_id: Optional[str] = None,
        history: list[str] = None,
        graph_facts: list[str] = None,
        relevant_scenes: list[str] = None,
    ) -> str:
        """Generate a short (1-sentence) suggestion in the author's voice using few-shot priming and narrative memory."""
        if not context_text or not blueprint:
            return ""

        # Fetch POV and tone from project if project_id is provided
        target_pov = "Third Person"
        tone_intention = "Balanced"
        
        if project_id:
            try:
                project_resp = (
                    self.supabase.table("projects")
                    .select("target_pov, tone_intention")
                    .eq("id", project_id)
                    .single()
                    .execute()
                )
                if project_resp.data:
                    target_pov = project_resp.data.get("target_pov") or "Third Person"
                    tone_intention = project_resp.data.get("tone_intention") or "Balanced"
            except Exception:
                pass  # Use defaults if fetch fails
        
        # Retrieve relevant scenes using RAG if project_id is provided and relevant_scenes not passed
        if project_id and relevant_scenes is None:
            try:
                rag_chunks = self.rag_service.retrieve_relevant_chunks(
                    project_id=project_id,
                    query_text=context_text[-500:],  # Use recent context as query
                    top_k=3,
                    threshold=0.3
                )
                relevant_scenes = [chunk["content"] for chunk in rag_chunks if chunk.get("content")]
            except Exception:
                relevant_scenes = []

        # Build a sophisticated voice reference using the new linguistic DNA
        anchors = "\n".join([f"- {a}" for a in blueprint.get("style_anchors", [])])
        vocab = ", ".join(blueprint.get("top_vocabulary", []))

        # Build Contextual Memory
        memory_block = ""
        if history:
            memory_block += (
                "RECENT EVENTS:\n"
                + "\n".join([f"- {h}" for h in history[-3:]])
                + "\n\n"
            )
        if graph_facts:
            memory_block += (
                "ESTABLISHED FACTS (Knowledge Graph):\n"
                + "\n".join(graph_facts)
                + "\n\n"
            )
        
        # Add relevant scenes from RAG
        if relevant_scenes:
            memory_block += (
                "RELEVANT PAST SCENES (from story memory):\n"
                + "\n".join([f"- {scene[:200]}..." if len(scene) > 200 else f"- {scene}" for scene in relevant_scenes])
                + "\n\n"
            )

        # Build POV instructions
        pov_instructions = self._get_pov_instructions(target_pov)

        system_prompt = (
            "You are an expert Ghostwriting Assistant. Your goal is to continue a story "
            "seamlessly by mimicking the author's unique 'Linguistic DNA' and respecting the story's established facts.\n\n"
            f"{memory_block}"
            "CURRENT STORY PROFILE:\n"
            f"- Genre: {blueprint.get('dominant_genre', 'Literary')}\n"
            f"- Emotion: {blueprint.get('dominant_emotion', 'Neutral')}\n"
            f"- Tone: {tone_intention}\n"
            f"- POV: {target_pov} (CRITICAL: Maintain this perspective consistently)\n"
            f"- Mood Description: {blueprint.get('description', 'Balanced structure.')}\n"
            f"- Signature Vocabulary: [{vocab}]\n\n"
            "VOICE ANCHORS (Reference these for rhythm and sentence structure):\n"
            f"{anchors}\n\n"
            "INSTRUCTIONS:\n"
            "1. ANALYZE context for TENSE (Past/Present) and POV (1st/3rd person).\n"
            f"2. POV REQUIREMENT: {pov_instructions}\n"
            "3. LOGIC: Ensure the suggestion aligns with RECENT EVENTS, RELEVANT PAST SCENES, and ESTABLISHED FACTS.\n"
            "4. ADAPT: Match the vocabulary level and syntactic complexity found in the Anchors.\n"
            "5. SYNTHESIZE: Provide exactly ONE continuation sentence (max 15 words).\n"
            "6. SEAMLESSNESS: The output must start exactly where the user left off.\n"
            "7. QUALITY: DO NOT repeat words, stutter, or use broken grammar (e.g., avoid 'iisss' or 'man man').\n\n"
            "OUTPUT FORMAT: Return only the continuation text. No quotes, no intro."
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"CONTINUE THIS TEXT SEAMLESSLY:\n...{context_text[-1000:]}",
                    },
                ],
                temperature=0.4,
                max_tokens=40,
            )
            suggestion = response.choices[0].message.content.strip()

            # Aggressive cleanup of wrapper quotes
            suggestion = suggestion.strip('"').strip("'")
            if suggestion.lower().startswith("suggestion:"):
                suggestion = suggestion[11:].strip()
            
            # Validate POV consistency
            if not self._validate_pov_consistency(suggestion, target_pov, context_text):
                # If POV validation fails, return empty to avoid breaking consistency
                return ""

            return suggestion
        except Exception as e:
            print(f"Enhanced Suggestion Error: {e}")
            return ""
    
    def _get_pov_instructions(self, target_pov: str) -> str:
        """Generate specific POV instructions based on the target POV."""
        pov_lower = target_pov.lower()
        
        if "first" in pov_lower:
            return "Use FIRST PERSON perspective (I, me, my, we, us, our). DO NOT use third-person pronouns (he, she, they) for the protagonist."
        elif "second" in pov_lower:
            return "Use SECOND PERSON perspective (you, your). Address the reader directly."
        else:  # Third person or default
            return "Use THIRD PERSON perspective (he, she, they, him, her, them). DO NOT use first-person pronouns (I, me) for the narrator."
    
    def _validate_pov_consistency(self, suggestion: str, target_pov: str, context_text: str) -> bool:
        """
        Validate that the suggestion maintains POV consistency.
        Returns True if valid, False if POV violation detected.
        """
        pov_lower = target_pov.lower()
        suggestion_lower = suggestion.lower()
        
        # Extract likely protagonist references from context
        # Simple heuristic: if context uses "I" frequently, protagonist is first-person
        context_lower = context_text[-500:].lower()
        
        if "first" in pov_lower:
            # First person: should not have third-person protagonist references
            # Check for patterns like "he walked", "she said" that might refer to protagonist
            # This is a basic check - more sophisticated NLP could improve this
            third_person_patterns = [
                r'\bhe\s+\w+ed\b',  # "he walked"
                r'\bshe\s+\w+ed\b',  # "she said"
                r'\bthey\s+\w+ed\b',  # "they went"
            ]
            
            # Only flag if context is clearly first-person and suggestion uses third-person
            if re.search(r'\b(i|my|me)\s+', context_lower):
                for pattern in third_person_patterns:
                    if re.search(pattern, suggestion_lower):
                        return False
        
        elif "third" in pov_lower:
            # Third person: should not have first-person narrator
            # Check if suggestion inappropriately uses "I" for narration
            if re.search(r'\bi\s+\w+ed\b', suggestion_lower):
                # Check if context is third-person
                if not re.search(r'\bi\s+', context_lower):
                    return False
        
        return True


_suggestion_service = None


def get_suggestion_service():
    global _suggestion_service
    if _suggestion_service is None:
        _suggestion_service = SuggestionService()
    return _suggestion_service
