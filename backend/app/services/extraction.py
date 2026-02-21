"""Core NLP extraction utilities for story analysis.

This module provides a lightweight pipeline around spaCy + fastcoref for:
1) Named entity extraction (NER)
2) Coreference resolution
3) Subject-Verb-Object (SVO) event extraction
"""

from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
from importlib.util import find_spec
import spacy
from spacy.language import Language
from spacy.tokens import Doc, Span, Token


SUBJECT_DEPS = {"nsubj", "nsubjpass", "csubj", "expl"}
OBJECT_DEPS = {"dobj", "obj", "iobj", "attr", "oprd", "dative", "pobj"}


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


def build_nlp_pipeline(model_name: str = "en_core_web_sm", enable_coref: bool = True) -> Language:
    """Build and return a spaCy pipeline with optional fastcoref component.

    Args:
        model_name: spaCy model name.
        enable_coref: Whether to add fastcoref component.
    """
    nlp = spacy.load(model_name)

    if enable_coref and "fastcoref" not in nlp.pipe_names:
        fastcoref_spec = find_spec("fastcoref")
        if fastcoref_spec is None:
            raise RuntimeError(
                "fastcoref is not installed. Install with: pip install fastcoref"
            )

        import_module("fastcoref")
        nlp.add_pipe("fastcoref", last=True)

    return nlp


def extract_named_entities(doc: Doc) -> list[dict[str, str]]:
    """Return named entities as simple dictionaries."""
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents]


def resolve_coreferences(doc: Doc) -> str:
    """Return resolved text if fastcoref is available on the pipeline output."""
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

        # Basic SVO triples, e.g. (Sarah, handed, key)
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

        # Prepositional relations, e.g. (Sarah, TO, John)
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
    """Extract SVO and prepositional action triples from a spaCy Doc."""
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

# Initialize the pipeline ONCE here
# Use "en_core_web_md" instead of "sm" for better accuracy if your RAM allows
nlp_pipeline = build_nlp_pipeline(model_name="en_core_web_md", enable_coref=True)

def get_extracted_data(text: str):
    # This is the function the Backend Lead will call
    return run_core_nlp_pipeline(text, nlp_pipeline)