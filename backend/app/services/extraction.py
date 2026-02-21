"""Core NLP extraction utilities for story analysis + Supabase persistence."""

from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
from importlib.util import find_spec

import spacy
from spacy.language import Language
from spacy.tokens import Doc, Span, Token
from supabase import Client

from lib.supabase import supabase_client as _default_supabase


SUBJECT_DEPS = {"nsubj", "nsubjpass", "csubj", "expl"}
OBJECT_DEPS = {"dobj", "obj", "iobj", "attr", "oprd", "dative", "pobj"}
ENTITY_LABEL_MAP = {
    "PERSON": "CHARACTER",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "FAC": "LOCATION",
    "ORG": "OBJECT",
    "NORP": "OBJECT",
    "PRODUCT": "OBJECT",
    "EVENT": "OBJECT",
    "WORK_OF_ART": "OBJECT",
    "LANGUAGE": "OBJECT",
    "DATE": "OBJECT",
    "TIME": "OBJECT",
}


@dataclass
class SVOTriple:
    subject: str
    relation: str
    object: str
    sentence: str


@dataclass
class ExtractionResult:
    normalized_text: str
    entities: list[dict[str, str]]
    triples: list[SVOTriple]


class ExtractionStore:
    """Supabase persistence helper for extraction outputs."""

    def __init__(self, project_id: str, supabase_client: Client | None = None) -> None:
        self.project_id = project_id
        self.supabase = supabase_client or _default_supabase

    def _map_entity_type(self, ner_label: str) -> str:
        return ENTITY_LABEL_MAP.get(ner_label, "OBJECT")

    def _entity_exists(self, name: str) -> bool:
        row = (
            self.supabase.table("entities")
            .select("id")
            .eq("project_id", self.project_id)
            .eq("name", name)
            .limit(1)
            .execute()
        )
        return bool(row.data)

    def upsert_entities(self, entities: list[dict[str, str]]) -> None:
        for entity in entities:
            name = entity["text"].strip()
            if not name:
                continue
            if self._entity_exists(name):
                continue

            self.supabase.table("entities").insert(
                {
                    "project_id": self.project_id,
                    "name": name,
                    "entity_type": self._map_entity_type(entity["label"]),
                    "is_initial_setup": False,
                }
            ).execute()

    def insert_narrative_chunk(self, content: str, embedding: list[float] | None = None) -> None:
        max_index_query = (
            self.supabase.table("narrative_chunks")
            .select("chunk_index")
            .eq("project_id", self.project_id)
            .order("chunk_index", desc=True)
            .limit(1)
            .execute()
        )
        latest = max_index_query.data or []
        next_idx = (latest[0]["chunk_index"] + 1) if latest else 1

        payload: dict[str, object] = {
            "project_id": self.project_id,
            "content": content,
            "chunk_index": next_idx,
        }
        if embedding is not None:
            payload["embedding"] = embedding

        self.supabase.table("narrative_chunks").insert(payload).execute()


def build_nlp_pipeline(model_name: str = "en_core_web_sm", enable_coref: bool = True) -> Language:
    """Build and return a spaCy pipeline with optional fastcoref component."""
    nlp = spacy.load(model_name)

    if enable_coref and "fastcoref" not in nlp.pipe_names:
        fastcoref_spec = find_spec("fastcoref")
        if fastcoref_spec is None:
            raise RuntimeError("fastcoref is not installed. Install with: pip install fastcoref")

        import_module("fastcoref")
        nlp.add_pipe("fastcoref", last=True)

    return nlp


def extract_named_entities(doc: Doc) -> list[dict[str, str]]:
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents]


def resolve_coreferences(doc: Doc) -> str:
    if not Doc.has_extension("resolved_text"):
        return doc.text

    resolved_text = doc._.resolved_text
    if not resolved_text:
        return doc.text

    return resolved_text


def _collect_subjects(verb: Token) -> list[Token]:
    return [child for child in verb.children if child.dep_ in SUBJECT_DEPS]


def _collect_objects(verb: Token) -> list[Token]:
    return [child for child in verb.children if child.dep_ in OBJECT_DEPS]


def _expand_noun_phrase(token: Token) -> str:
    if token is None:
        return ""
    if token.subtree:
        return " ".join([t.text for t in token.subtree])
    return token.text


def _triples_from_sentence(sentence: Span) -> list[SVOTriple]:
    triples: list[SVOTriple] = []

    for token in sentence:
        if token.pos_ != "VERB":
            continue

        subjects = _collect_subjects(token)
        objects = _collect_objects(token)

        for subject in subjects:
            for obj in objects:
                triples.append(
                    SVOTriple(
                        subject=_expand_noun_phrase(subject),
                        relation=token.lemma_.upper(),
                        object=_expand_noun_phrase(obj),
                        sentence=sentence.text,
                    )
                )

        for prep in [child for child in token.children if child.dep_ == "prep"]:
            pobj_candidates = [child for child in prep.children if child.dep_ == "pobj"]
            for subject in subjects:
                for pobj in pobj_candidates:
                    triples.append(
                        SVOTriple(
                            subject=_expand_noun_phrase(subject),
                            relation=prep.text.upper(),
                            object=_expand_noun_phrase(pobj),
                            sentence=sentence.text,
                        )
                    )

    return triples


def extract_svo_triples(doc: Doc) -> list[SVOTriple]:
    triples: list[SVOTriple] = []
    for sentence in doc.sents:
        triples.extend(_triples_from_sentence(sentence))
    return triples


def run_core_nlp_pipeline(text: str, nlp: Language) -> ExtractionResult:
    """Run NER -> coreference resolution -> SVO extraction for input text."""
    original_doc = nlp(text)
    entities = extract_named_entities(original_doc)

    normalized_text = resolve_coreferences(original_doc)
    if normalized_text != original_doc.text:
        parsed_doc = nlp.make_doc(normalized_text)
        for pipe_name, pipe in nlp.pipeline:
            if pipe_name == "fastcoref":
                continue
            parsed_doc = pipe(parsed_doc)
    else:
        parsed_doc = original_doc

    triples = extract_svo_triples(parsed_doc)

    return ExtractionResult(
        normalized_text=normalized_text,
        entities=entities,
        triples=triples,
    )


def run_and_persist_core_nlp_pipeline(
    *,
    project_id: str,
    text: str,
    nlp: Language,
    embedding: list[float] | None = None,
    supabase_client: Client | None = None,
) -> ExtractionResult:
    """Run extraction and write entities/chunks to Supabase."""
    result = run_core_nlp_pipeline(text=text, nlp=nlp)

    store = ExtractionStore(project_id=project_id, supabase_client=supabase_client)
    store.upsert_entities(result.entities)
    store.insert_narrative_chunk(content=result.normalized_text, embedding=embedding)

    return result