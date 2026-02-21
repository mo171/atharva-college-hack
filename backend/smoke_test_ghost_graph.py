import sys
import os

# Add backend/app to path
sys.path.append(os.path.join(os.getcwd(), "backend", "app"))

from services.suggestion import SuggestionService


def test_graph_aware_suggestion():
    service = SuggestionService()

    blueprint = {
        "style_anchors": [
            "The shadows danced across the velvet floor.",
            "Silence was his only companion now.",
        ],
        "top_vocabulary": ["shadows", "velvet", "companion", "silence"],
        "description": "Sentences are long and immersive.",
    }

    history = [
        "Marcus found the ancient key in the cellar.",
        "He knew the key would open the vault in the West Wing.",
    ]

    graph_facts = [
        "Marcus OWNER_OF ancient key",
        "Key OPENS vault",
        "Vault LOCATED_IN West Wing",
    ]

    context = "Marcus stepped into the West Wing, the key heavy in his pocket. He reached the door."

    print("Generating suggestion...")
    suggestion = service.get_ghost_suggestion(
        context_text=context,
        blueprint=blueprint,
        history=history,
        graph_facts=graph_facts,
    )

    print(f"Context: {context}")
    print(f"Suggestion: {suggestion}")

    if any(
        word in suggestion.lower()
        for word in ["key", "vault", "door", "marcus", "wing"]
    ):
        print("SUCCESS: Suggestion is contextually aware.")
    else:
        print("WARNING: Suggestion might be too generic.")


if __name__ == "__main__":
    if "OPENAI_API_KEY" not in os.environ:
        print("Set OPENAI_API_KEY to run this test.")
    else:
        test_graph_aware_suggestion()
