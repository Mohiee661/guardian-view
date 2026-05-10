import os
from pathlib import Path

import requests
from dotenv import load_dotenv


# Load environment variables from the root .env file.
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")


# Read the Groq API key from the environment.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def calculate_risk_score(log: dict) -> int:
    """Calculate a simple risk score for a log entry."""
    score = 0

    # Add risk when activity happens outside normal working hours.
    hour = int(log["timestamp"].split(":")[0])
    if hour < 8 or hour > 20:
        score += 40

    # Add risk for destructive actions.
    if log["action"] == "file_delete":
        score += 30

    # Add risk when the resource appears sensitive.
    if "confidential" in log["resource"].lower():
        score += 30

    # Keep the score within a 0-100 range.
    return min(score, 100)


def rule_based_explanation(log: dict) -> str:
    """Return a simple explanation when Groq is unavailable."""
    if log["status"] == "suspicious" or log.get("risk_score", 0) >= 50:
        return (
            "This activity is suspicious because it occurred outside normal "
            "working hours or involves sensitive actions."
        )

    return "This activity appears normal based on the user's time and action."


def explain_log(log: dict) -> str:
    """Generate a human-readable explanation for a log entry using Groq."""
    # If no Groq API key is available, use a simple rule-based explanation.
    if not GROQ_API_KEY:
        return rule_based_explanation(log)

    prompt = (
        "Explain why this activity is suspicious or normal in 1-2 lines.\n\n"
        f"User: {log['user']}\n"
        f"Timestamp: {log['timestamp']}\n"
        f"Action: {log['action']}\n"
        f"Resource: {log['resource']}\n"
        f"Status: {log['status']}\n"
        f"Risk Score: {log.get('risk_score', 0)}"
    )

    payload = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        # Send the log explanation prompt to the Groq chat completions API.
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()

    except requests.RequestException:
        # Keep the API working even if the Groq request fails.
        return rule_based_explanation(log)
