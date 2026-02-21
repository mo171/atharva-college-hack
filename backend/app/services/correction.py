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


# Singleton instance for the app
_suite = None


def get_correction_suite():
    global _suite
    if _suite is None:
        _suite = CorrectionSuite()
    return _suite
