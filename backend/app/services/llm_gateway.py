"""OpenAI gateway utilities for author-facing insight generation + Supabase sync."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass

from openai import OpenAI
from supabase import Client

from lib.supabase import supabase_client as _default_supabase


@dataclass
class ConflictInput:
    """Conflict payload consumed by insight generation."""

    subject: str
    relation: str
    object: str
    existing_objects: list[str]


class InsightGenerator:
    """Generate short author alerts from deterministic graph conflicts.

    This replaces a local-LLM (e.g. Ollama) workflow with OpenAI API calls.
    """

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is required for insight generation.")

        self.client = OpenAI(api_key=self.api_key)
        self.model = model

    @staticmethod
    def _build_prompt(conflict: ConflictInput, max_words: int) -> str:
        existing = ", ".join(conflict.existing_objects) if conflict.existing_objects else "none"
        return (
            "You are an editorial assistant for fiction writers. "
            "Write one concise alert that points out continuity problems. "
            f"Use at most {max_words} words.\n\n"
            "Conflict details:\n"
            f"- Subject: {conflict.subject}\n"
            f"- Relation: {conflict.relation}\n"
            f"- New claim: {conflict.subject} -> {conflict.relation} -> {conflict.object}\n"
            f"- Existing facts for same subject+relation: {existing}\n\n"
            "Rules:\n"
            "1) Mention the contradiction clearly.\n"
            "2) Ask a short clarifying question for the author.\n"
            "3) Return only the alert sentence, no bullets or metadata."
        )

    def generate_conflict_alert(self, conflict: ConflictInput, max_words: int = 10) -> str:
        """Generate a short alert sentence for a detected story inconsistency."""
        prompt = self._build_prompt(conflict, max_words=max_words)

        response = self.client.responses.create(
            model=self.model,
            input=prompt,
            temperature=0.2,
        )

        alert = (response.output_text or "").strip()
        if not alert:
            return (
                f"Potential conflict: {conflict.subject} {conflict.relation} {conflict.object}; "
                "please verify continuity."
            )

        return alert


class SupabaseInsightService:
    """Generate and persist author alerts for consistency logs in Supabase."""

    def __init__(
        self,
        project_id: str,
        api_key: str | None = None,
        model: str = "gpt-4o-mini",
        supabase_client: Client | None = None,
    ) -> None:
        self.project_id = project_id
        self.supabase = supabase_client or _default_supabase
        self.generator = InsightGenerator(api_key=api_key, model=model)

    @staticmethod
    def _conflict_from_log(log_row: dict) -> ConflictInput:
        explanation = log_row.get("explanation") or ""

        subject = "UNKNOWN_SUBJECT"
        relation = "RELATED_TO"
        object_value = "UNKNOWN_OBJECT"

        match = re.search(r"Inconsistency for \((.*?), (.*?), (.*?)\)", explanation)
        if match:
            subject = match.group(1).strip()
            relation = match.group(2).strip()
            object_value = match.group(3).strip()

        existing_objects: list[str] = []
        marker = "Existing graph facts:"
        if marker in explanation:
            tail = explanation.split(marker, 1)[1].strip().strip(".")
            tail = tail.strip("[]")
            if tail:
                existing_objects = [item.strip().strip("'\"") for item in tail.split(",") if item.strip()]

        return ConflictInput(
            subject=subject,
            relation=relation,
            object=object_value,
            existing_objects=existing_objects,
        )

    def fetch_pending_inconsistency_logs(self, limit: int = 50) -> list[dict]:
        """Get pending INCONSISTENCY logs for this project."""
        response = (
            self.supabase.table("consistency_logs")
            .select("id,project_id,issue_type,status,explanation,suggested_fix,original_text")
            .eq("project_id", self.project_id)
            .eq("issue_type", "INCONSISTENCY")
            .eq("status", "PENDING")
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return response.data or []

    def generate_and_store_alert(self, log_id: str, conflict: ConflictInput, max_words: int = 10) -> str:
        """Generate alert and store in suggested_fix on consistency_logs row."""
        alert = self.generator.generate_conflict_alert(conflict=conflict, max_words=max_words)
        self.supabase.table("consistency_logs").update({"suggested_fix": alert}).eq("id", log_id).execute()
        return alert

    def process_pending_logs(self, max_words: int = 10, limit: int = 50) -> list[dict[str, str]]:
        """Generate and persist alerts for pending inconsistency logs."""
        rows = self.fetch_pending_inconsistency_logs(limit=limit)
        results: list[dict[str, str]] = []

        for row in rows:
            conflict = self._conflict_from_log(row)
            alert = self.generate_and_store_alert(
                log_id=row["id"],
                conflict=conflict,
                max_words=max_words,
            )
            results.append({"log_id": row["id"], "alert": alert})

        return results


def generate_alert_from_inconsistency(
    inconsistency: object,
    api_key: str | None = None,
    model: str = "gpt-4o-mini",
    max_words: int = 10,
) -> str:
    """Convenience adapter for analysis.Inconsistency objects."""
    conflict = ConflictInput(
        subject=getattr(inconsistency, "subject"),
        relation=getattr(inconsistency, "relation"),
        object=getattr(inconsistency, "object"),
        existing_objects=list(getattr(inconsistency, "existing_objects")),
    )
    generator = InsightGenerator(api_key=api_key, model=model)
    return generator.generate_conflict_alert(conflict=conflict, max_words=max_words)


def generate_and_store_alert_for_log(
    *,
    project_id: str,
    log_id: str,
    subject: str,
    relation: str,
    object_value: str,
    existing_objects: list[str],
    api_key: str | None = None,
    model: str = "gpt-4o-mini",
    max_words: int = 10,
    supabase_client: Client | None = None,
) -> str:
    """One-shot helper to generate alert and persist it on consistency_logs."""
    service = SupabaseInsightService(
        project_id=project_id,
        api_key=api_key,
        model=model,
        supabase_client=supabase_client,
    )
    conflict = ConflictInput(
        subject=subject,
        relation=relation,
        object=object_value,
        existing_objects=existing_objects,
    )
    return service.generate_and_store_alert(log_id=log_id, conflict=conflict, max_words=max_words)


def get_embedding(text: str, api_key: str | None = None, model: str = "text-embedding-3-small") -> list[float]:
    """Return embedding vector for text. Used by project_setup and extraction persist flow."""
    key = api_key or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is required for embeddings.")
    client = OpenAI(api_key=key)
    resp = client.embeddings.create(model=model, input=[text])
    return resp.data[0].embedding