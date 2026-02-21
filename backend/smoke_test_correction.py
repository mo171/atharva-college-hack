from app.services.correction import get_correction_suite
import sys
import os

# Add app dir to path so 'services' can be found
app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(app_path)


def test_correction():
    print("Initializing Correction Suite...")
    suite = get_correction_suite()

    # Test Spelling (Local)
    print("\n--- Testing Spelling (Local) ---")
    typo_text = "thsi is a typo"
    spelling_alerts = suite.check_spelling(typo_text)
    print(f"Spelling Alerts: {spelling_alerts}")

    # Test Grammar (LLM)
    print("\n--- Testing Grammar (LLM) ---")
    grammar_text = "They is here."
    grammar_alerts = suite.check_grammar(grammar_text)
    print(f"Grammar Alerts: {grammar_alerts}")

    # Combined Test
    print("\n--- Testing Full Analysis ---")
    full_text = "The apothecary silense was deep. Elias have a key."
    all_alerts = suite.analyze_polish(full_text)
    print(f"Total Alerts Found: {len(all_alerts)}")
    for a in all_alerts:
        print(
            f" - [{a['type']}] {a['explanation']} (Text: {a.get('original_text', 'N/A')})"
        )


if __name__ == "__main__":
    if not os.environ.get("OPENAI_API_KEY"):
        print(
            "Error: OPENAI_API_KEY is not set. Please set it before running this test."
        )
        sys.exit(1)
    test_correction()
