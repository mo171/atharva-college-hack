from spellchecker import SpellChecker
import re
from services.llm_gateway import InsightGenerator


class CorrectionSuite:
    def __init__(self, lang="en-US"):
        self.spell = SpellChecker()
        self.generator = InsightGenerator()

    def check_spelling(self, text: str) -> list[dict]:
        """Detect spelling errors and return alerts."""
        # Clean text to get words (simple regex)
        words = re.findall(r"\b\w+\b", text)
        misspelled = self.spell.unknown(words)

        import uuid

        alerts = []
        for word in misspelled:
            # We skip highly capitalized acronyms or things that look like character names
            # (though Story Brain should eventually handle custom dictionaries)
            if word.isupper() and len(word) > 1:
                continue

            suggestions = list(self.spell.candidates(word) or [])[:3]
            suggestion_text = (
                f"Did you mean: {', '.join(suggestions)}?" if suggestions else ""
            )

            alerts.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "SPELLING",
                    "entity": word,
                    "explanation": f"Possible typo found: '{word}'. {suggestion_text}",
                    "original_text": word,
                }
            )
        return alerts

    def check_grammar(self, text: str) -> list[dict]:
        """Detect grammar errors and return alerts using OpenAI."""
        try:
            return self.generator.generate_grammar_alerts(text)
        except Exception as e:
            print(f"Warning: LLM Grammar check failed: {e}")
            return []

    def analyze_polish(self, text: str) -> list[dict]:
        """Combine spelling and grammar checks."""
        alerts = []
        alerts.extend(self.check_spelling(text))
        alerts.extend(self.check_grammar(text))
        return alerts

    def apply_spelling_fix(self, text: str, word: str, suggestion: str) -> str:
        """Replace a misspelled word with its suggestion."""
        # Use word boundaries to avoid partial matches
        pattern = re.compile(r"\b" + re.escape(word) + r"\b", re.IGNORECASE)
        return pattern.sub(suggestion, text)

    def generate_corrected_text(self, text: str, alerts: list[dict]) -> str:
        """Generate a corrected version of the text by applying all alerts."""
        corrected = text

        # Process alerts in order, but we need to be careful about overlapping text
        # Sort by position in text (if available) or process spelling first, then grammar

        # First, apply spelling fixes (they're simpler word replacements)
        spelling_alerts = [a for a in alerts if a.get("type") == "SPELLING"]
        for alert in spelling_alerts:
            original = alert.get("original_text", "")
            if original:
                # Extract first suggestion from explanation or use spellchecker
                explanation = alert.get("explanation", "")
                if "Did you mean:" in explanation:
                    suggestions = (
                        explanation.split("Did you mean:")[1].split("?")[0].strip()
                    )
                    first_suggestion = suggestions.split(",")[0].strip()
                    if first_suggestion:
                        corrected = self.apply_spelling_fix(
                            corrected, original, first_suggestion
                        )
                else:
                    # Fallback: use spellchecker directly
                    suggestions = list(self.spell.candidates(original) or [])
                    if suggestions:
                        corrected = self.apply_spelling_fix(
                            corrected, original, suggestions[0]
                        )

        # Then apply grammar/style fixes using LLM
        grammar_alerts = [a for a in alerts if a.get("type") in ["GRAMMAR", "STYLE"]]
        if grammar_alerts:
            try:
                # Build a prompt to fix all grammar issues at once
                alert_descriptions = []
                for alert in grammar_alerts:
                    original = alert.get("original_text", "")
                    explanation = alert.get("explanation", "")
                    if original and explanation:
                        alert_descriptions.append(f"- '{original}': {explanation}")

                if alert_descriptions:
                    prompt = (
                        "You are a professional copyeditor. Fix the following text by applying these corrections:\n\n"
                        + "\n".join(alert_descriptions)
                        + "\n\n"
                        "Return ONLY the corrected text, maintaining the same structure and style. "
                        "Do not add explanations or markdown.\n\n"
                        f"Text to correct:\n{corrected}"
                    )

                    response = self.generator.client.chat.completions.create(
                        model=self.generator.model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                    )

                    corrected = (
                        response.choices[0].message.content or corrected
                    ).strip()
            except Exception as e:
                print(f"Warning: LLM correction failed: {e}")

        return corrected


# Singleton instance for the app
_suite = None


def get_correction_suite():
    global _suite
    if _suite is None:
        _suite = CorrectionSuite()
    return _suite
