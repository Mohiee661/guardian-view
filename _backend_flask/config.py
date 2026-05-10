import os
from pathlib import Path


def load_env_file(filename=".env"):
    """Load simple KEY=VALUE pairs from a local .env file."""
    current_dir = Path(__file__).resolve().parent
    possible_paths = [
        Path.cwd() / filename,
        current_dir / filename,
        current_dir.parent / filename,
    ]

    env_path = next((path for path in possible_paths if path.exists()), None)
    if env_path is None:
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()

            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


# Load local environment variables before reading API keys.
load_env_file()


# Read the Groq API key from the environment instead of hardcoding it.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# Warn developers when the API key is missing.
if GROQ_API_KEY is None:
    print("Warning: GROQ_API_KEY not set")
