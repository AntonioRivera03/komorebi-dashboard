"""Provider-neutral execution policy. Prompts/transcripts remain capability-owned.

Budget units are provider-independent token units, NOT a currency estimate. A provider
must respect max_output_tokens and report total input/output usage. Failed/ambiguous
requests retain their reservation until operator reconciliation, preventing overspend.
"""

from dataclasses import dataclass
from typing import Protocol

from sqlalchemy import select, update

from komorebi_server.core.database import insert_once
from komorebi_server.core.models import AIBudget, AIRun
from komorebi_server.shared.contracts.common import AppError, utcnow


@dataclass(frozen=True)
class AIResult:
    text: str
    used_units: int


class AIProvider(Protocol):
    name: str
    model: str

    def generate(
        self, messages: list[dict], *, max_output_tokens: int, timeout_seconds: float
    ) -> AIResult: ...


class AIGateway:
    def __init__(self, db, settings, provider: AIProvider | None = None):
        self.db, self.settings, self.provider = db, settings, provider

    def generate(self, ctx, run_id: str, messages: list[dict], max_output_tokens=1024):
        ctx.require("ai:execute")
        if not self.provider:
            raise AppError("ai_needs_setup", "No AI provider is configured.", 503)
        if not self.settings.ai_disclosure_allowed:
            raise AppError("ai_disclosure_required", "AI data disclosure must be enabled.", 403)
        if not 1 <= max_output_tokens <= 8192:
            raise AppError(
                "invalid_ai_limit", "Output limit must be between 1 and 8192 tokens.", 422
            )
        # UTF-8 bytes form a conservative input ceiling for adapters using byte-level tokenizers.
        reservation = sum(len(m["content"].encode()) + 32 for m in messages) + max_output_tokens
        month = utcnow().strftime("%Y-%m")
        with self.db.transaction() as session:
            claimed = insert_once(
                session,
                AIRun.__table__,
                dict(
                    id=run_id,
                    user_id=ctx.actor_id,
                    month=month,
                    status="running",
                    reserved_units=reservation,
                    provider=self.provider.name,
                    model=self.provider.model,
                ),
                ["id"],
            )
            if not claimed:
                raise AppError("ai_run_exists", "Reconcile the original AI run before retrying.")
            insert_once(
                session,
                AIBudget.__table__,
                dict(user_id=ctx.actor_id, month=month),
                ["user_id", "month"],
            )
            reserved = session.execute(
                update(AIBudget)
                .where(
                    AIBudget.user_id == ctx.actor_id,
                    AIBudget.month == month,
                    AIBudget.used + AIBudget.reserved + reservation
                    <= self.settings.ai_monthly_budget_units,
                )
                .values(reserved=AIBudget.reserved + reservation)
                .returning(AIBudget.user_id)
            )
            if reserved.scalar_one_or_none() is None:
                raise AppError("ai_budget_exceeded", "The monthly AI budget has been reached.", 409)
        try:
            result = self.provider.generate(
                messages, max_output_tokens=max_output_tokens, timeout_seconds=60
            )
            if result.used_units < 0 or result.used_units > reservation:
                raise AppError(
                    "invalid_provider_usage", "Provider usage violated the budget contract."
                )
        except Exception:
            with self.db.transaction() as session:
                session.execute(
                    update(AIRun)
                    .where(AIRun.id == run_id)
                    .values(status="unknown_outcome", error="provider_failed")
                )
            raise AppError(
                "ai_provider_failed", "AI execution failed; its budget remains reserved.", 503
            ) from None
        with self.db.transaction() as session:
            run = session.scalar(select(AIRun).where(AIRun.id == run_id).with_for_update())
            if run.status == "canceled":
                raise AppError("ai_canceled", "The result was discarded after cancellation.")
            run.status, run.used_units = "completed", result.used_units
            session.execute(
                update(AIBudget)
                .where(
                    AIBudget.user_id == ctx.actor_id,
                    AIBudget.month == month,
                )
                .values(
                    reserved=AIBudget.reserved - reservation, used=AIBudget.used + result.used_units
                )
            )
        return result

    def has_run(self, run_id: str) -> bool:
        with self.db.transaction() as session:
            return session.get(AIRun, run_id) is not None

    def cancel(self, ctx, run_id):
        ctx.require("ai:execute")
        with self.db.transaction() as session:
            run = session.scalar(
                select(AIRun)
                .where(
                    AIRun.id == run_id,
                    AIRun.user_id == ctx.actor_id,
                )
                .with_for_update()
            )
            if not run:
                raise AppError("not_found", "AI run not found.", 404)
            if run.status == "running":
                run.status = "canceled"
                # The provider may still charge; keep the reservation until reconciliation.
