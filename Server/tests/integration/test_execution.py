from datetime import timedelta

import pytest
from sqlalchemy import func, select

from komorebi_server.capabilities.usage.bootstrap import Observation
from komorebi_server.core.ai import AIGateway, AIResult
from komorebi_server.core.jobs import Worker, enqueue
from komorebi_server.core.models import AIBudget, AIRun, Job, LoginSession, Receipt
from komorebi_server.shared.contracts.common import AppError, new_id, utcnow
from tests.integration.test_core import context, create_task


class Provider:
    name = "deterministic-test"
    model = "test-v1"

    def __init__(self, fail=False):
        self.calls = 0
        self.fail = fail

    def generate(self, messages, *, max_output_tokens, timeout_seconds):
        self.calls += 1
        assert timeout_seconds <= 60
        if self.fail:
            raise TimeoutError("a secret token must not be logged")
        return AIResult(text="A persisted test reply", used_units=42)


def test_outbox_receipts_and_worker_restart(app, client):
    create_task(client)
    platform = app.state.platform
    worker = Worker(platform, app.state.modules)
    worker.dispatch()
    claim = worker.claim()
    assert claim is not None
    assert Worker(platform, app.state.modules).claim() is None
    # Simulate a process disappearing; a new worker can reclaim the expired lease.
    with platform.db.transaction() as session:
        session.get(Job, claim.id).lease_until = utcnow() - timedelta(seconds=1)
    restarted = Worker(platform, app.state.modules)
    recovered = restarted.claim()
    assert recovered.id == claim.id and recovered.lease_token != claim.lease_token
    worker.finish(claim, "completed", None)  # Stale worker cannot overwrite its successor.
    with platform.db.transaction() as session:
        assert session.get(Job, claim.id).status == "running"
    restarted.process(recovered)
    with platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Observation)) == 1
        assert session.scalar(select(func.count()).select_from(Receipt)) == 1
        row = session.get(Job, claim.id)
        row.status = "queued"
        row.available_at = utcnow()
    restarted.process(restarted.claim())  # Deliberate duplicate event attempt.
    with platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Observation)) == 1


def test_poison_job_revocation_and_external_pause(app, client):
    ctx = context(app, client)
    platform = app.state.platform
    worker = Worker(platform, app.state.modules)
    with platform.db.transaction() as session:
        poison = enqueue(session, ctx, "tasks", "tasks.unknown.v9", {}, "poison")
    worker.tick()
    with platform.db.transaction() as session:
        row = session.get(Job, poison)
        assert row.status == "failed" and row.last_error == "unknown_job_type"
        enqueue(
            session, ctx, "conversations", "conversations.reply.v1", {}, "external", external=True
        )
    assert worker.claim() is None
    create_task(client)
    with platform.db.transaction() as session:
        session.get(LoginSession, ctx.session_id).revoked_at = utcnow()
    worker.tick()
    with platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Observation)) == 0
        assert (
            session.scalar(select(Job).where(Job.type == "platform.event.v1")).last_error
            == "unauthenticated"
        )


def test_final_attempt_crash_becomes_visible_failure(app, client):
    ctx = context(app, client)
    worker = Worker(app.state.platform, app.state.modules)
    with app.state.platform.db.transaction() as session:
        job_id = enqueue(session, ctx, "tasks", "tasks.test.v1", {}, "final")
        session.flush()
        job = session.get(Job, job_id)
        job.status, job.attempts = "running", 5
        job.lease_until = utcnow() - timedelta(seconds=1)
    assert worker.claim() is None
    with app.state.platform.db.transaction() as session:
        assert session.get(Job, job_id).status == "failed"


def test_ai_policy_budget_and_uncertain_failure(app, client):
    ctx = context(app, client)
    platform = app.state.platform
    provider = Provider()
    configured = platform.settings.model_copy(update={"ai_disclosure_allowed": True})
    gateway = AIGateway(platform.db, configured, provider)
    with pytest.raises(AppError, match="No AI provider"):
        platform.ai.generate(ctx, new_id(), [{"role": "user", "content": "Hi"}])
    result = gateway.generate(ctx, new_id(), [{"role": "user", "content": "Hi"}])
    assert result.used_units == 42 and provider.calls == 1
    with platform.db.transaction() as session:
        budget = session.scalars(select(AIBudget)).one()
        assert budget.used == 42 and budget.reserved == 0
    configured.ai_monthly_budget_units = 43
    with pytest.raises(AppError, match="budget"):
        gateway.generate(ctx, new_id(), [{"role": "user", "content": "Hi"}])
    assert provider.calls == 1
    configured.ai_monthly_budget_units = 100000
    gateway.provider = Provider(fail=True)
    run_id = new_id()
    with pytest.raises(AppError, match="remains reserved"):
        gateway.generate(ctx, run_id, [{"role": "user", "content": "Hi"}])
    with platform.db.transaction() as session:
        assert session.get(AIRun, run_id).status == "unknown_outcome"
        assert session.scalars(select(AIBudget)).one().reserved > 0
    with pytest.raises(AppError, match="Reconcile"):
        gateway.generate(ctx, run_id, [{"role": "user", "content": "Hi"}])
    assert gateway.provider.calls == 1


def test_conversation_persists_input_and_reply(app, client):
    platform = app.state.platform
    platform.settings.external_jobs_enabled = True
    platform.settings.ai_disclosure_allowed = True
    provider = Provider()
    platform.ai.provider = provider
    thread = client.post(
        "/api/v1/conversations/threads",
        json={"title": "An intention"},
        headers={"Idempotency-Key": "thread"},
    ).json()["value"]
    url = f"/api/v1/conversations/threads/{thread['id']}/messages"
    headers = {"Idempotency-Key": "send", "If-Match": "1"}
    pending = client.post(url, json={"content": "Help me plan"}, headers=headers)
    assert pending.status_code == 202, pending.text
    assert (
        client.post(url, json={"content": "Help me plan"}, headers=headers).json() == pending.json()
    )
    assert len(client.get(url).json()["data"]) == 1
    worker = Worker(platform, app.state.modules)
    for _ in range(5):
        worker.tick()
    messages = client.get(url).json()["data"]
    assert [m["role"] for m in messages] == ["user", "assistant"]
    assert messages[1]["content"] == "A persisted test reply"
    assert provider.calls == 1
    assert client.get(pending.json()["pollUrl"]).json()["data"]["status"] == "completed"


def test_conversation_provider_failure_preserves_input(app, client):
    app.state.platform.settings.external_jobs_enabled = True
    thread = client.post(
        "/api/v1/conversations/threads",
        json={"title": "Retain this"},
        headers={"Idempotency-Key": "thread"},
    ).json()["value"]
    url = f"/api/v1/conversations/threads/{thread['id']}/messages"
    pending = client.post(
        url,
        json={"content": "Keep my question"},
        headers={"Idempotency-Key": "send", "If-Match": "1"},
    ).json()
    worker = Worker(app.state.platform, app.state.modules)
    for _ in range(3):
        worker.tick()
    status = client.get(pending["pollUrl"]).json()["data"]
    assert status["status"] == "failed" and status["lastError"] == "ai_needs_setup"
    assert client.get(url).json()["data"][0]["content"] == "Keep my question"


def test_external_lease_loss_requires_reconciliation(app, client):
    platform = app.state.platform
    platform.settings.external_jobs_enabled = True
    ctx = context(app, client)
    with platform.db.transaction() as session:
        job_id = enqueue(
            session,
            ctx,
            "conversations",
            "conversations.reply.v1",
            {},
            "lost-external",
            external=True,
        )
    worker = Worker(platform, app.state.modules)
    job = worker.claim()
    with platform.db.transaction() as session:
        session.get(Job, job.id).lease_until = utcnow() - timedelta(seconds=1)
    assert worker.claim() is None
    with platform.db.transaction() as session:
        assert session.get(Job, job_id).status == "unknown_outcome"
    response = client.post(
        f"/api/v1/core/jobs/{job_id}/retry", headers={"Idempotency-Key": "retry"}
    )
    assert response.status_code == 409


def test_event_effect_and_receipt_roll_back_together(app, client):
    from dataclasses import replace

    from komorebi_server.capabilities.usage.bootstrap import observe

    def fail(session, ctx, event):
        observe(session, ctx, event)
        session.flush()
        raise RuntimeError("Crash after local effect")

    modules = []
    for module in app.state.modules:
        if module.name == "usage":
            module = replace(
                module,
                subscriptions=tuple(replace(sub, handler=fail) for sub in module.subscriptions),
            )
        modules.append(module)
    create_task(client)
    Worker(app.state.platform, modules).tick()
    with app.state.platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Observation)) == 0
        assert session.scalar(select(func.count()).select_from(Receipt)) == 0
        job = session.scalars(select(Job)).one()
        assert job.status == "queued" and job.last_error == "handler_failed"
        job.available_at = utcnow()
    Worker(app.state.platform, app.state.modules).tick()
    with app.state.platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Observation)) == 1
        assert session.scalar(select(func.count()).select_from(Receipt)) == 1


def test_notification_deduplication_and_acknowledgement(app, client):
    ctx = context(app, client)
    for _ in range(2):
        with app.state.platform.db.transaction() as session:
            app.state.platform.notify(
                session, ctx, "same-notification", "Ready", "An inbox message"
            )
    items = client.get("/api/v1/core/notifications").json()["data"]
    assert len(items) == 1
    url = f"/api/v1/core/notifications/{items[0]['id']}/read"
    assert client.post(url).status_code == 204
    assert client.get("/api/v1/core/notifications").json()["data"][0]["readAt"] is not None
