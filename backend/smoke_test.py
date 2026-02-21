"""
Minimal smoke tests for the FastAPI backend.

This file can be run manually:

    uvicorn app.app:app --reload
    python -m backend.smoke_test

It exercises:
  - GET /health
  - POST /projects/setup
  - POST /editor/analyze

using in-memory fakes for Supabase and the LLM so that it does not
depend on external services being available.
"""

import sys
from pathlib import Path

# Add the 'app' directory to sys.path to support local imports within 'app'
app_dir = Path(__file__).resolve().parent / "app"
sys.path.append(str(app_dir))

from fastapi.testclient import TestClient

import app as fastapi_module  # This will find app.py since 'app/' is in sys.path
from routes import project as project_routes
from routes import editor as editor_routes
from services import analysis as analysis_service
from services import project_setup as project_setup_service
from services import llm_gateway as llm_gateway_service


class FakeTable:
    def __init__(self) -> None:
        self._rows = []

    # The Supabase Python client uses a fluent interface; we imitate only what's used.
    def insert(self, obj):
        self._rows.append(obj)
        return self

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def execute(self):
        return type("Resp", (), {"data": list(self._rows)})


class FakeSupabaseClient:
    def __init__(self) -> None:
        self._tables = {}

    def table(self, name: str):
        if name not in self._tables:
            self._tables[name] = FakeTable()
        return self._tables[name]

    def rpc(self, *_args, **_kwargs):
        # For smoke purposes, just return a successful empty response
        return type("Resp", (), {"data": None})


class FakeLLM:
    def get_embedding(self, _text: str):
        # Return a tiny deterministic vector
        return [0.0, 1.0, 0.0]

    def explain_inconsistency(self, **_kwargs):
        return "This is a fake inconsistency explanation for smoke testing."


def run_smoke_tests() -> None:
    # Patch dependencies to use fakes (no external calls)
    fake_supabase = FakeSupabaseClient()
    fake_llm = FakeLLM()

    # Patch services and routes that use Supabase / LLM
    analysis_service.supabase_client = fake_supabase
    project_setup_service.supabase_client = fake_supabase
    editor_routes.supabase_client = fake_supabase

    analysis_service.llm = fake_llm
    project_setup_service.llm = fake_llm
    llm_gateway_service.llm = fake_llm

    client = TestClient(fastapi_module.app)

    # 1. Health
    health = client.get("/health")
    assert health.status_code == 200, f"/health failed: {health.text}"

    # 2. Project setup
    payload = {
        "user_id": "test-user",
        "title": "Test Story",
        "genre": "Fantasy",
        "perspective": "Third Person",
        "tone": "Adventurous",
        "characters": [
            {"name": "John", "description": "A weary knight"},
        ],
        "world_setting": "The story takes place in a floating city.",
    }
    setup_res = client.post("/projects/setup", json=payload)
    assert setup_res.status_code == 200, f"/projects/setup failed: {setup_res.text}"
    project_id = setup_res.json()["project_id"]

    # 3. Narrative analysis
    analyze_res = client.post(
        "/editor/analyze",
        json={
            "project_id": project_id,
            "content": "John is marked as dead but still walks around.",
        },
    )
    assert analyze_res.status_code == 200, f"/editor/analyze failed: {analyze_res.text}"

    print("Smoke tests passed for /health, /projects/setup, and /editor/analyze.")


if __name__ == "__main__":
    run_smoke_tests()
