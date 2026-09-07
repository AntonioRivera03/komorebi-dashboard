"""Deterministic offline schema export; no database or configured credentials required."""

import json
from pathlib import Path

from komorebi_server.app.api import create_app
from komorebi_server.core.config import Settings

settings = Settings(
    _env_file=None,
    environment="test",
    session_secret="offline-schema-generation-no-live-session" * 2,
    enabled_modules=["tasks", "usage", "conversations", "learn"],
    encryption_key=None,
)
output = Path(__file__).resolve().parents[1] / "openapi.json"
output.write_text(json.dumps(create_app(settings).openapi(), indent=2, sort_keys=True) + "\n")
print(output)
