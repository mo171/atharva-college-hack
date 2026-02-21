import os
from supabase import create_client, Client

from config import settings


def get_supabase_client() -> Client:
    """
    Construct a Supabase client using centralized settings.
    """
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError(
            "Supabase configuration is missing. "
            "Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set."
        )

    return create_client(settings.supabase_url, settings.supabase_anon_key)


# Backwards-compatible export and the name used throughout routes/services
supabase_client: Client = get_supabase_client()
supabase: Client = supabase_client

