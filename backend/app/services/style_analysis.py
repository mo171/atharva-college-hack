import numpy as np
import spacy
from collections import Counter
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import fitz  # PyMuPDF
import re

# =========================================================
# MODELS (Lazy Load Singleton Pattern)
# =========================================================


class StyleModels:
    _instance = None

    def __init__(self):
        print("Loading Meso (Flow) Models...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            return_all_scores=True,
        )
        self.genre_classifier = pipeline(
            "zero-shot-classification", model="facebook/bart-large-mnli"
        )
        self.nlp = spacy.load("en_core_web_sm")
        print("Meso Models loaded.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance


# =========================================================
# CORE ANALYSIS LOGIC
# =========================================================


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def analyze_writer_style(text: str):
    models = StyleModels.get_instance()

    # 1. Genre
    candidate_labels = [
        "horror",
        "fantasy",
        "science fiction",
        "romance",
        "thriller",
        "literary",
        "mystery",
    ]
    genre_res = models.genre_classifier(text[:2000], candidate_labels)
    genres = dict(zip(genre_res["labels"], genre_res["scores"]))

    # 2. Emotions
    chunks = [text[i : i + 500] for i in range(0, min(len(text), 5000), 500)]
    emotion_totals = Counter()
    for chunk in chunks:
        output = models.emotion_classifier(chunk)
        results = output[0] if isinstance(output[0], list) else output
        for r in results:
            emotion_totals[r["label"]] += float(r["score"])

    total = sum(emotion_totals.values())
    emotions = {k: v / total for k, v in emotion_totals.items()} if total > 0 else {}

    # 3. Structural Style
    doc = models.nlp(text[:10000])
    sent_lens = [len(sent.text.split()) for sent in doc.sents]
    avg_len = np.mean(sent_lens) if sent_lens else 0

    vocab = set([token.lemma_.lower() for token in doc if token.is_alpha])
    richness = len(vocab) / len([t for t in doc if t.is_alpha]) if len(doc) > 0 else 0

    # 4. Interpretations (The Blueprint)
    style_blueprint = {
        "genre": max(genres, key=genres.get) if genres else "Unknown",
        "dominant_emotion": max(emotions, key=emotions.get) if emotions else "Neutral",
        "avg_sentence_length": float(avg_len),
        "vocab_richness": float(richness),
        "description": _generate_style_description(avg_len, richness),
    }

    return style_blueprint


def _generate_style_description(avg_len, richness):
    desc = []
    if avg_len > 18:
        desc.append("Sentences are long and immersive.")
    elif avg_len < 12:
        desc.append("Sentences are short and punchy.")
    else:
        desc.append("Sentence length is balanced.")

    if richness > 0.45:
        desc.append("Vocabulary is diverse and expressive.")
    else:
        desc.append("Language is simple and direct.")

    return " ".join(desc)
