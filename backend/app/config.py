import os
from typing import List

from dotenv import load_dotenv


load_dotenv()


class Settings:
    """
    Centralized configuration for the backend.

    Reads from environment variables (optionally via a .env file).
    """

    def __init__(self) -> None:
        # Core external services
        self.openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_anon_key: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

        # HTTP / CORS
        self.cors_allowed_origins: List[str] = self._parse_list_env(
            "BACKEND_CORS_ORIGINS",
            default=["http://localhost:3000", "http://127.0.0.1:3000"],
        )

        # LLM model choices (can be overridden via env)
        self.openai_embedding_model: str = os.getenv(
            "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
        )
        self.openai_chat_model: str = os.getenv(
            "OPENAI_CHAT_MODEL", "gpt-4o-mini"
        )

    @staticmethod
    def _parse_list_env(name: str, default: List[str]) -> List[str]:
        raw = os.getenv(name)
        if not raw:
            return default
        return [item.strip() for item in raw.split(",") if item.strip()]


settings = Settings()

