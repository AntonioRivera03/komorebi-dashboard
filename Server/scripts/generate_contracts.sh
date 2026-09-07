#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
uv run python scripts/export_openapi.py
npx --yes openapi-typescript@7.13.0 openapi.json -o ../Web/src/generated/api.d.ts
