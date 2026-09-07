import hashlib
import json
from collections.abc import Callable

from sqlalchemy.orm import Session

from komorebi_server.core.database import insert_once
from komorebi_server.core.models import Audit, Idempotency, Outbox
from komorebi_server.shared.contracts.common import AppError, RequestContext


def command(
    session: Session,
    ctx: RequestContext,
    operation: str,
    key: str,
    payload: dict,
    execute: Callable[[], dict],
) -> dict:
    if not key or len(key) > 128:
        raise AppError(
            "invalid_idempotency_key", "Supply an Idempotency-Key of 1–128 characters.", 422
        )
    digest = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    ).hexdigest()
    identity = dict(actor_id=ctx.actor_id, operation=operation, key=key)
    inserted = insert_once(
        session, Idempotency.__table__, {**identity, "payload_hash": digest}, list(identity)
    )
    record = session.get(Idempotency, (ctx.actor_id, operation, key))
    if not inserted:
        if record.payload_hash != digest:
            raise AppError("idempotency_conflict", "This key was already used for different input.")
        if record.result is None:
            raise AppError(
                "operation_pending", "The original operation has not completed.", 409, True
            )
        return record.result
    result = execute()
    record.result = result
    session.flush()
    return result


def record_change(
    session: Session,
    ctx: RequestContext,
    module: str,
    action: str,
    resource_id: str,
    revision: int,
    payload: dict | None = None,
):
    session.add(
        Audit(
            actor_id=ctx.actor_id,
            action=action,
            resource_id=resource_id,
            correlation_id=ctx.correlation_id,
        )
    )
    session.add(
        Outbox(
            module=module,
            type=action,
            actor_id=ctx.actor_id,
            session_id=ctx.session_id,
            correlation_id=ctx.correlation_id,
            aggregate_id=resource_id,
            aggregate_revision=revision,
            payload=payload or {},
        )
    )
