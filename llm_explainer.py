import json
from urllib import request

from config import GROQ_API_KEY


def rule_based_explanation(log: dict) -> str:
    """Return a simple explanation when Groq is not configured."""
    if log["status"] == "suspicious":
        return (
            "This activity is suspicious because it occurred outside normal "
            "working hours or involves sensitive actions."
        )

    return "This activity appears normal based on the user's time and action."


def explain_log(log: dict) -> str:
    """Generate a human-readable explanation for a log entry."""
    # If no Groq API key is available, use a simple rule-based explanation.
    if not GROQ_API_KEY:
        return rule_based_explanation(log)

    prompt = (
        "Explain this security log in one short sentence. "
        "Mention why it is normal or suspicious.\n\n"
        f"User: {log['user']}\n"
        f"Timestamp: {log['timestamp']}\n"
        f"Action: {log['action']}\n"
        f"Resource: {log['resource']}\n"
        f"Status: {log['status']}"
    )

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    try:
        # Send the log explanation prompt to the Groq chat completions API.
        api_request = request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with request.urlopen(api_request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))

        return result["choices"][0]["message"]["content"].strip()

    except Exception:
        # Keep the API working even if the Groq request fails.
        return rule_based_explanation(log)
