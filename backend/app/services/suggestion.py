from openai import OpenAI
import os


class SuggestionService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)

    def get_ghost_suggestion(self, context_text: str, blueprint: dict) -> str:
        """Generate a short (1-sentence) suggestion in the author's voice."""
        if not context_text or not blueprint:
            return ""

        system_prompt = (
            "You are a ghostwriting assistant that mimics an author's unique voice. "
            "Continue the story with exactly ONE short sentence (max 15 words). "
            f"The author's style is: {blueprint.get('description', 'Balanced.')} "
            f"The dominant emotion is {blueprint.get('dominant_emotion', 'Neutral')}. "
            "Do not use internal monologue unless requested. Just provide the next narrative step."
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"Context:\n{context_text[-1000:]}\n\nContinue:",
                    },
                ],
                temperature=0.7,
                max_tokens=30,
            )
            suggestion = response.choices[0].message.content.strip()
            # Clean up quotes if LLM added them
            suggestion = suggestion.strip('"').strip("'")
            return suggestion
        except Exception as e:
            print(f"Suggestion Error: {e}")
            return ""


_suggestion_service = None


def get_suggestion_service():
    global _suggestion_service
    if _suggestion_service is None:
        _suggestion_service = SuggestionService()
    return _suggestion_service
