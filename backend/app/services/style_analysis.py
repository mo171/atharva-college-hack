import numpy as np
import spacy
from collections import Counter
from transformers import pipeline
import fitz  # PyMuPDF
import re
from typing import Dict, Any, List

# =========================================================
# MODELS (Singleton Pattern for Hackathon Efficiency)
# =========================================================

class StyleModels:
    _instance = None

    def __init__(self):
        print("🚀 Loading High-Fidelity Style Models...")
        # For detecting the "Vibe"
        self.emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None
        )
        # For detecting the "Genre"
        self.genre_classifier = pipeline(
            "zero-shot-classification", 
            model="facebook/bart-large-mnli"
        )
        # For linguistic structure
        self.nlp = spacy.load("en_core_web_sm")
        print("✅ Style Models Ready.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

# =========================================================
# HELPER UTILITIES
# =========================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Converts uploaded manuscript PDFs into clean text."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = "".join([page.get_text() for page in doc])
    return text

def _generate_style_description(avg_len: float, richness: float) -> str:
    """Converts raw data into human-readable editorial feedback."""
    desc = []
    if avg_len > 22: desc.append("Prose is expansive and complex.")
    elif avg_len < 12: desc.append("Prose is punchy, minimalist, and fast-paced.")
    else: desc.append("Prose follows a balanced, rhythmic structure.")

    if richness > 0.5: desc.append("Vocabulary is diverse and sophisticated.")
    else: desc.append("Language is grounded and direct.")
    
    return " ".join(desc)

# =========================================================
# CORE STYLE ANALYSIS ENGINE
# =========================================================

def analyze_writer_style(text: str) -> Dict[str, Any]:
    """
    Analyzes a writing sample to extract a 'Style Blueprint'.
    This DNA is then used to prevent the AI from giving generic 'footsteps' suggestions.
    """
    models = StyleModels.get_instance()
    
    # 1. Linguistic DNA Extraction (spaCy)
    doc = models.nlp(text[:15000]) # Sample limit for performance
    
    # Extract real sentences as 'Anchors' for Few-Shot prompting
    # We look for medium-length sentences that are complete thoughts
    sentences = [s.text.strip() for s in doc.sents if 10 < len(s.text.split()) < 25]
    style_anchors = sentences[:5] 

    # Extract Vocabulary Fingerprints (Favorite adjectives and verbs)
    vocab_favors = [token.lemma_.lower() for token in doc 
                    if token.pos_ in ["ADJ", "ADV", "VERB"] and not token.is_stop and token.is_alpha]
    top_vocab = [word for word, count in Counter(vocab_favors).most_common(12)]

    # 2. Structure Math
    sent_lens = [len(sent.text.split()) for sent in doc.sents]
    avg_len = np.mean(sent_lens) if sent_lens else 0
    richness = len(set(t.lower_ for t in doc if t.is_alpha)) / len(doc) if len(doc) > 0 else 0

    # 3. Atmosphere & Genre (Hugging Face)
    # Analyze middle chunk to avoid 'Chapter 1' title bias
    sample_chunk = text[1000:3000] if len(text) > 3000 else text
    
    # Genre Detection
    genre_labels = ["horror", "fantasy", "noir", "romance", "thriller", "literary"]
    genre_res = models.genre_classifier(sample_chunk, genre_labels)
    
    # Emotion Detection
    emotion_res = models.emotion_classifier(sample_chunk[:512])[0]
    dominant_emotion = max(emotion_res, key=lambda x: x['score'])['label']

    # 4. FINAL BLUEPRINT CONSTRUCTION
    style_blueprint = {
        "dominant_genre": genre_res["labels"][0],
        "dominant_emotion": dominant_emotion.capitalize(),
        "avg_sentence_length": round(float(avg_len), 2),
        "vocab_richness": round(float(richness), 2),
        "description": _generate_style_description(avg_len, richness),
        "style_anchors": style_anchors,  # These go directly into Suggestion Prompt
        "top_vocabulary": top_vocab      # These guide word choice
    }

    return style_blueprint