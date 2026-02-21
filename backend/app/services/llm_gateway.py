import os
from typing import List

from openai import OpenAI

from app.config import settings


class LLMGateway:
    """
    Thin wrapper around the OpenAI client, providing the small set of
    operations the app needs: embeddings and inconsistency explanations.
    """

    def __init__(self, api_key: str | None = None):
        effective_key = api_key or settings.openai_api_key
        if not effective_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not configured. "
                "Set it in your environment or .env file."
            )

        self.client = OpenAI(api_key=effective_key)

    def get_embedding(self, text: str) -> List[float]:
        """
        Return a single embedding vector for the given text.
        """
        response = self.client.embeddings.create(
            model=settings.openai_embedding_model,
            input=[text],
        )
        return response.data[0].embedding

    def explain_inconsistency(
        self,
        context: str,
        current_text: str,
        violation_type: str,
    ) -> str:
        """
        Ask the LLM to explain a narrative inconsistency in a concise way.
        """
        prompt = (
            "You are a narrative consistency assistant. "
            "Given the story memory context, the current text, and a violation "
            "type, explain the inconsistency in 1-3 concise sentences.\n\n"
            f"Context: {context}\n"
            f"Violation type: {violation_type}\n"
            f"Current text: {current_text}\n"
        )

        completion = self.client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[
                {"role": "system", "content": "You analyze narrative consistency."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        return completion.choices[0].message.content or ""


# Shared instance for modules that just need a ready-to-use gateway
llm = LLMGateway(api_key=os.getenv("OPENAI_API_KEY"))

