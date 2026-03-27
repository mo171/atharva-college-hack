import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load .env from app directory so it works regardless of cwd
load_dotenv(Path(__file__).resolve().parent / ".env")
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
        
        # Cache settings
        self.kg_cache_ttl_seconds: int = int(os.getenv("KG_CACHE_TTL_SECONDS", "300"))
        self.kg_cache_max_size: int = int(os.getenv("KG_CACHE_MAX_SIZE", "100"))
        
        # RAG settings
        self.rag_similarity_threshold: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.3"))
        self.rag_top_k: int = int(os.getenv("RAG_TOP_K", "3"))
        
        # Character summary settings
        self.character_summary_throttle_seconds: int = int(
            os.getenv("CHARACTER_SUMMARY_THROTTLE_SECONDS", "600")
        )
        self.character_summary_max_per_analysis: int = int(
            os.getenv("CHARACTER_SUMMARY_MAX_PER_ANALYSIS", "3")
        )

    @staticmethod
    def _parse_list_env(name: str, default: List[str]) -> List[str]:
        raw = os.getenv(name)
        if not raw:
            return default
        return [item.strip() for item in raw.split(",") if item.strip()]


settings = Settings()

