from services.llm_gateway import InsightGenerator


class CorrectionSuite:
    def __init__(self, lang="en-US"):
        self.generator = InsightGenerator()

    def check_grammar(self, text: str) -> list[dict]:
        """Detect grammar, spelling, and style errors and return alerts using OpenAI."""
        try:
            return self.generator.generate_grammar_alerts(text)
        except Exception as e:
            print(f"Warning: LLM Polish check failed: {e}")
            return []

    def analyze_polish(self, text: str) -> list[dict]:
        """Analyze text for spelling, grammar, and style using LLM."""
        return self.check_grammar(text)

    def generate_corrected_text(self, text: str, alerts: list[dict]) -> str:
        """Generate a corrected version of the text by applying all alerts."""
        corrected = text

        # Apply grammar/spelling/style fixes using LLM
        valid_alerts = [
            a for a in alerts if a.get("type") in ["SPELLING", "GRAMMAR", "STYLE"]
        ]
        if valid_alerts:
            try:
                # Build a prompt to fix all polish issues at once
                alert_descriptions = []
                for alert in valid_alerts:
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
