from typing import Annotated

from fastapi import Header

from komorebi_server.shared.contracts.common import AppError

IdempotencyKey = Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=128)]


def revision(value: Annotated[str, Header(alias="If-Match")]) -> int:
    raw = value.strip('"')
    if not raw.isdecimal() or int(raw) < 1:
        raise AppError("invalid_revision", "If-Match must contain a positive revision number.", 422)
    return int(raw)
