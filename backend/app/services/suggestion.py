from openai import OpenAI
import os


class SuggestionService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)

    def get_ghost_suggestion(
        self,
        context_text: str,
        blueprint: dict,
        history: list[str] = None,
        graph_facts: list[str] = None,
    ) -> str:
        """Generate a short (1-sentence) suggestion in the author's voice using few-shot priming and narrative memory."""
        if not context_text or not blueprint:
            return ""

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

        system_prompt = (
            "You are an expert Ghostwriting Assistant. Your goal is to continue a story "
            "seamlessly by mimicking the author's unique 'Linguistic DNA' and respecting the story's established facts.\n\n"
            f"{memory_block}"
            "CURRENT STORY PROFILE:\n"
            f"- Genre: {blueprint.get('dominant_genre', 'Literary')}\n"
            f"- Emotion: {blueprint.get('dominant_emotion', 'Neutral')}\n"
            f"- Mood Description: {blueprint.get('description', 'Balanced structure.')}\n"
            f"- Signature Vocabulary: [{vocab}]\n\n"
            "VOICE ANCHORS (Reference these for rhythm and sentence structure):\n"
            f"{anchors}\n\n"
            "INSTRUCTIONS:\n"
            "1. ANALYZE context for TENSE (Past/Present) and POV (1st/3rd person).\n"
            "2. LOGIC: Ensure the suggestion aligns with RECENT EVENTS and ESTABLISHED FACTS.\n"
            "3. ADAPT: Match the vocabulary level and syntactic complexity found in the Anchors.\n"
            "4. SYNTHESIZE: Provide exactly ONE continuation sentence (max 15 words).\n"
            "5. SEAMLESSNESS: The output must start exactly where the user left off.\n\n"
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
                temperature=0.8,
                max_tokens=40,
            )
            suggestion = response.choices[0].message.content.strip()

            # Aggressive cleanup of wrapper quotes
            suggestion = suggestion.strip('"').strip("'")
            if suggestion.lower().startswith("suggestion:"):
                suggestion = suggestion[11:].strip()

            return suggestion
        except Exception as e:
            print(f"Enhanced Suggestion Error: {e}")
            return ""


_suggestion_service = None


def get_suggestion_service():
    global _suggestion_service
    if _suggestion_service is None:
        _suggestion_service = SuggestionService()
    return _suggestion_service
