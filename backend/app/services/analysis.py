"""Knowledge graph + Supabase persistence for deterministic story memory."""

from __future__ import annotations

from dataclasses import dataclass

import networkx as nx
from supabase import Client

from lib.supabase import supabase


@dataclass
class Inconsistency:
    subject: str
    relation: str
    object: str
    existing_objects: list[str]
    message: str


class StoryKnowledgeGraph:
    """Story memory graph that can load from and sync to Supabase."""

    def _init_(self, project_id: str, supabase_client: Client | None = None) -> None:
        self.project_id = project_id
        self.graph = nx.MultiDiGraph()
        self.supabase = supabase_client or supabase
        self.entity_ids_by_name: dict[str, str] = {}

    @classmethod
    def from_supabase(cls, project_id: str, supabase_client: Client | None = None) -> "StoryKnowledgeGraph":
        """Build graph by loading entities and relationships for a project."""
        kg = cls(project_id=project_id, supabase_client=supabase_client)
        kg.load_from_supabase()
        return kg

    def load_from_supabase(self) -> None:
        """Hydrate graph state from entities and relationships tables."""
        entities_resp = (
            self.supabase.table("entities")
            .select("id,name,entity_type")
            .eq("project_id", self.project_id)
            .execute()
        )
        entities = entities_resp.data or []

        self.entity_ids_by_name = {}
        id_to_name: dict[str, str] = {}

        for row in entities:
            name = row["name"]
            entity_id = row["id"]
            entity_type = row.get("entity_type")
            self.graph.add_node(name, node_type=entity_type)
            self.entity_ids_by_name[name] = entity_id
            id_to_name[entity_id] = name

        rel_resp = (
            self.supabase.table("relationships")
            .select("entity_a_id,entity_b_id,relation_type,description")
            .eq("project_id", self.project_id)
            .execute()
        )
        relationships = rel_resp.data or []

        for row in relationships:
            subject = id_to_name.get(row.get("entity_a_id"))
            obj = id_to_name.get(row.get("entity_b_id"))
            relation = (row.get("relation_type") or "RELATED_TO").upper()
            description = row.get("description")
            if not subject or not obj:
                continue
            self.graph.add_edge(subject, obj, relation=relation, description=description)

    def add_node(self, name: str, node_type: str | None = None) -> None:
        attrs = {"node_type": node_type} if node_type else {}
        self.graph.add_node(name, **attrs)

    def _ensure_entity_in_supabase(self, name: str, node_type: str = "OBJECT") -> str:
        existing_id = self.entity_ids_by_name.get(name)
        if existing_id:
            return existing_id

        fetch = (
            self.supabase.table("entities")
            .select("id,name")
            .eq("project_id", self.project_id)
            .eq("name", name)
            .limit(1)
            .execute()
        )
        rows = fetch.data or []
        if rows:
            entity_id = rows[0]["id"]
            self.entity_ids_by_name[name] = entity_id
            if name not in self.graph:
                self.graph.add_node(name, node_type=node_type)
            return entity_id

        insert = (
            self.supabase.table("entities")
            .insert(
                {
                    "project_id": self.project_id,
                    "name": name,
                    "entity_type": node_type if node_type in {"CHARACTER", "LOCATION", "OBJECT"} else "OBJECT",
                    "is_initial_setup": False,
                }
            )
            .execute()
        )
        entity_id = insert.data[0]["id"]
        self.entity_ids_by_name[name] = entity_id
        if name not in self.graph:
            self.graph.add_node(name, node_type=node_type)
        return entity_id

    def add_fact(
        self,
        subject: str,
        relation: str,
        obj: str,
        *,
        persist: bool = True,
        description: str | None = None,
    ) -> None:
        normalized_relation = relation.upper()
        self.graph.add_node(subject)
        self.graph.add_node(obj)
        self.graph.add_edge(subject, obj, relation=normalized_relation, description=description)

        if not persist:
            return

        entity_a_id = self._ensure_entity_in_supabase(subject)
        entity_b_id = self._ensure_entity_in_supabase(obj)

        existing_rel = (
            self.supabase.table("relationships")
            .select("id")
            .eq("project_id", self.project_id)
            .eq("entity_a_id", entity_a_id)
            .eq("entity_b_id", entity_b_id)
            .eq("relation_type", normalized_relation)
            .limit(1)
            .execute()
        )
        if existing_rel.data:
            return

        self.supabase.table("relationships").insert(
            {
                "project_id": self.project_id,
                "entity_a_id": entity_a_id,
                "entity_b_id": entity_b_id,
                "relation_type": normalized_relation,
                "description": description,
            }
        ).execute()

    def get_objects_for_relation(self, subject: str, relation: str) -> list[str]:
        relation = relation.upper()
        if subject not in self.graph:
            return []

        matches: list[str] = []
        for _, target, edge_data in self.graph.out_edges(subject, data=True):
            if edge_data.get("relation") == relation:
                matches.append(target)
        return matches

    def check_inconsistency(self, subject: str, relation: str, obj: str) -> Inconsistency | None:
        relation = relation.upper()
        existing_objects = self.get_objects_for_relation(subject, relation)

        if not existing_objects or obj in existing_objects:
            return None

        return Inconsistency(
            subject=subject,
            relation=relation,
            object=obj,
            existing_objects=existing_objects,
            message=(
                f"Inconsistency for ({subject}, {relation}, {obj}). "
                f"Existing graph facts: {existing_objects}."
            ),
        )

    def _log_consistency_issue(self, issue: Inconsistency, original_text: str | None = None) -> None:
        involved_ids: list[str] = []
        for name in [issue.subject, issue.object, *issue.existing_objects]:
            entity_id = self.entity_ids_by_name.get(name)
            if entity_id:
                involved_ids.append(entity_id)

        suggested_fix = (
            f"Reconcile {issue.subject}'s {issue.relation} state before accepting '{issue.object}'."
        )

        self.supabase.table("consistency_logs").insert(
            {
                "project_id": self.project_id,
                "issue_type": "INCONSISTENCY",
                "severity": "MEDIUM",
                "original_text": original_text,
                "explanation": issue.message,
                "suggested_fix": suggested_fix,
                "status": "PENDING",
                "involved_entity_ids": list(dict.fromkeys(involved_ids)),
            }
        ).execute()

    def upsert_fact(
        self,
        subject: str,
        relation: str,
        obj: str,
        *,
        persist: bool = True,
        original_text: str | None = None,
    ) -> Inconsistency | None:
        issue = self.check_inconsistency(subject, relation, obj)
        if issue is None:
            self.add_fact(subject, relation, obj, persist=persist, description=original_text)
            return None

        if persist:
            self._log_consistency_issue(issue, original_text=original_text)
        return issue

    def apply_extracted_triples(
        self,
        triples: list[tuple[str, str, str]],
        *,
        persist: bool = True,
        original_text: str | None = None,
    ) -> list[Inconsistency]:
        issues: list[Inconsistency] = []
        for subject, relation, obj in triples:
            issue = self.upsert_fact(
                subject,
                relation,
                obj,
                persist=persist,
                original_text=original_text,
            )
            if issue:
                issues.append(issue)
        return issues

    def apply_svo_triples(self, triples: list[object], *, persist: bool = True) -> list[Inconsistency]:
        issues: list[Inconsistency] = []
        for triple in triples:
            issue = self.upsert_fact(
                subject=getattr(triple, "subject"),
                relation=getattr(triple, "relation"),
                obj=getattr(triple, "object"),
                persist=persist,
                original_text=getattr(triple, "sentence", None),
            )
            if issue:
                issues.append(issue)
        return issues