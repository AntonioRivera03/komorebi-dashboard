"""Run with `uv run --with pgserver pytest`: real isolated PostgreSQL, no Docker required."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from alembic import command as alembic_command
from alembic.config import Config
from sqlalchemy import func, select, text

from komorebi_server.app.composition import compose
from komorebi_server.capabilities.tasks.models import Task
from komorebi_server.capabilities.tasks.service import Tasks
from komorebi_server.core.database import Database
from komorebi_server.core.identity import bootstrap, context_for_session, redeem_ticket
from komorebi_server.core.jobs import Worker
from komorebi_server.core.models import Idempotency, Job, Outbox
from komorebi_server.shared.contracts.common import AppError, new_id
from komorebi_server.shared.contracts.tasks import TaskDraft


@pytest.fixture
def postgres(tmp_path, settings, monkeypatch):
    pgserver = pytest.importorskip("pgserver", reason="Run with uv run --with pgserver pytest")
    server = pgserver.get_server(tmp_path / "pg", cleanup_mode="delete")
    url = server.get_uri().replace("postgresql://", "postgresql+psycopg://", 1)
    monkeypatch.setenv("KOMOREBI_MIGRATION_DATABASE_URL", url)
    config = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    alembic_command.upgrade(config, "head")
    db = Database(url)
    settings = settings.model_copy(update={"database_url": url})
    platform, modules = compose(settings, db=db)
    ticket = bootstrap(db, "Postgres Test")
    with db.transaction() as session:
        record = redeem_ticket(session, ticket, 24)
        ctx = context_for_session(session, record.id, new_id())
    yield platform, modules, ctx, config
    db.engine.dispose()
    server.cleanup()


def test_postgres_migrations_and_schema_ownership(postgres):
    platform, _, _, config = postgres
    alembic_command.upgrade(config, "head")
    with platform.db.transaction() as session:
        assert (
            session.scalar(text("SELECT version_num FROM alembic_version")) == "0006_source_imports"
        )
        schemas = set(
            session.scalars(
                text(
                    "SELECT DISTINCT table_schema FROM information_schema.tables "
                    "WHERE table_schema IN ('platform', 'tasks', 'usage', 'conversations', 'learn')"
                )
            )
        )
        assert schemas == {"platform", "tasks", "usage", "conversations", "learn"}
    # A frozen baseline upgrades, downgrades and upgrades again on a clean installation.
    alembic_command.downgrade(config, "base")
    alembic_command.upgrade(config, "head")
    alembic_command.check(config)


def test_concurrent_idempotency_and_revision_arbitration(postgres):
    platform, _, ctx, _ = postgres
    service = Tasks(platform)
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(
            executor.map(
                lambda _: service.create(ctx, TaskDraft(title="Exactly once"), "same-key"), range(8)
            )
        )
    assert all(r == results[0] for r in results)
    task_id = results[0]["value"]["id"]
    with platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Task)) == 1
        assert session.scalar(select(func.count()).select_from(Outbox)) == 1
        assert session.scalar(select(func.count()).select_from(Idempotency)) == 1

    def change(i):
        try:
            return service.change(ctx, task_id, 1, f"edit-{i}", "completed")["status"]
        except AppError as exc:
            return exc.code

    with ThreadPoolExecutor(max_workers=2) as executor:
        assert sorted(executor.map(change, range(2))) == ["completed", "revision_conflict"]


def test_postgres_workers_do_not_share_a_lease(postgres):
    platform, modules, ctx, _ = postgres
    service = Tasks(platform)
    for i in range(12):
        service.create(ctx, TaskDraft(title=f"Task {i}"), f"create-{i}")
    Worker(platform, modules).dispatch()
    workers = [Worker(platform, modules) for _ in range(12)]
    with ThreadPoolExecutor(max_workers=12) as executor:
        jobs = list(executor.map(lambda worker: worker.claim(), workers))
    assert all(jobs)
    assert len({job.id for job in jobs}) == 12
    assert Worker(platform, modules).claim() is None
    with ThreadPoolExecutor(max_workers=12) as executor:
        list(executor.map(lambda pair: pair[0].process(pair[1]), zip(workers, jobs)))
    with platform.db.transaction() as session:
        assert (
            session.scalar(select(func.count()).select_from(Job).where(Job.status == "completed"))
            == 12
        )


def test_postgres_concurrent_ai_run_and_budget(postgres):
    from komorebi_server.core.ai import AIGateway
    from komorebi_server.core.models import AIBudget
    from tests.integration.test_execution import Provider

    platform, _, ctx, _ = postgres
    settings = platform.settings.model_copy(update={"ai_disclosure_allowed": True})
    provider = Provider()
    gateway = AIGateway(platform.db, settings, provider)
    run_id = new_id()

    def generate(_):
        try:
            return gateway.generate(ctx, run_id, [{"role": "user", "content": "Hi"}]).text
        except AppError as exc:
            return exc.code

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(generate, range(8)))
    assert results.count("ai_run_exists") == 7
    assert provider.calls == 1
    with platform.db.transaction() as session:
        budget = session.scalars(select(AIBudget)).one()
        assert budget.used == 42 and budget.reserved == 0


def test_postgres_learning_concurrent_writers_and_retry(postgres):
    from komorebi_server.capabilities.learn.service import Learn
    from komorebi_server.shared.contracts.learn import LearnWorkspace

    platform, _, ctx, _ = postgres
    learn = Learn(platform)
    data = LearnWorkspace()
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(lambda _: learn.save(ctx, data, 0, "learn-once"), range(4)))
    assert all(result == results[0] for result in results)
    assert learn.get(ctx).data.revision == 1

    def change(i):
        try:
            return learn.save(ctx, data, 1, f"learn-edit-{i}")["status"]
        except AppError as exc:
            return exc.code

    with ThreadPoolExecutor(max_workers=2) as executor:
        assert sorted(executor.map(change, range(2))) == ["completed", "revision_conflict"]
    assert learn.get(ctx).data.revision == 2
    other = ctx.model_copy(update={"actor_id": new_id()})
    assert learn.get(other).data.revision == 0
