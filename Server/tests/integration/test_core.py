from datetime import timedelta

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from komorebi_server.app.api import create_app
from komorebi_server.capabilities.tasks.models import Task
from komorebi_server.core.database import Database
from komorebi_server.core.identity import bootstrap, context_for_session, issue_ticket
from komorebi_server.core.models import Audit, Credential, Idempotency, Outbox, User
from komorebi_server.core.storage import SecretStore
from komorebi_server.core.transactions import command, record_change
from komorebi_server.shared.contracts.common import AppError, new_id, utcnow


def create_task(client, key="create-1", title="Build backend"):
    return client.post("/api/v1/tasks", json={"title": title}, headers={"Idempotency-Key": key})


def context(app, client):
    sid = client.get("/api/v1/core/session").json()["sessionId"]
    with app.state.platform.db.transaction() as session:
        return context_for_session(session, sid, new_id())


def test_durable_task_idempotency_revision_history(app, client, settings):
    first = create_task(client)
    assert first.status_code == 201, first.text
    assert create_task(client).json() == first.json()
    assert create_task(client, title="Different").status_code == 409
    task = first.json()["value"]
    url = f"/api/v1/tasks/{task['id']}/complete"
    headers = {"Idempotency-Key": "complete", "If-Match": '"1"'}
    response = client.post(url, headers=headers)
    assert response.status_code == 200, response.text
    assert response.json()["value"]["revision"] == 2
    assert client.post(url, headers=headers).json() == response.json()
    assert client.post(url, headers={**headers, "Idempotency-Key": "stale"}).status_code == 409
    changes = client.get(f"/api/v1/tasks/{task['id']}/history").json()["data"]
    assert {r["kind"] for r in changes} == {"created", "completed"}
    with app.state.platform.db.transaction() as session:
        assert session.scalar(select(func.count()).select_from(Task)) == 1
        assert session.scalar(select(func.count()).select_from(Outbox)) == 2
        assert session.scalar(select(func.count()).select_from(Audit)) == 2
    # A new engine and app, with the original cookie, read committed data after restart.
    restarted = create_app(settings, db=Database(settings.database_url.get_secret_value()))
    with TestClient(restarted) as other:
        other.cookies.update(client.cookies)
        assert other.get(f"/api/v1/tasks/{task['id']}").json()["data"]["status"] == "completed"
    restarted.state.platform.db.engine.dispose()


def test_auth_csrf_pairing_revocation_and_ownership(app, client):
    task_id = create_task(client).json()["value"]["id"]
    with TestClient(app) as anonymous:
        assert anonymous.get("/api/v1/tasks").status_code == 401
    client.headers.pop("X-CSRF-Token")
    assert create_task(client).status_code == 403
    me = client.get("/api/v1/core/session").json()
    client.headers["X-CSRF-Token"] = me["csrfToken"]
    assert (
        client.post("/api/v1/core/pairings", json={"name": "Bad", "scopes": ["*"]}).status_code
        == 422
    )
    pair = client.post("/api/v1/core/pairings", json={"name": "Wall"}).json()
    with TestClient(app) as display:
        response = display.post("/api/v1/core/session", json={"ticket": pair["ticket"]})
        assert response.status_code == 200
        session_id = response.json()["sessionId"]
        assert display.get("/api/v1/tasks").status_code == 403
        assert display.get("/api/v1/core/preferences").status_code == 403
        assert display.get(f"/api/v1/tasks/{task_id}").status_code == 403
        assert (
            display.post("/api/v1/core/session", json={"ticket": pair["ticket"]}).status_code == 401
        )
        assert client.delete(f"/api/v1/core/devices/{session_id}").status_code == 204
        assert display.get("/api/v1/core/session").status_code == 401
    with app.state.platform.db.transaction() as session:
        user = User(name="Second trusted owner")
        session.add(user)
        session.flush()
        ticket = issue_ticket(session, user.id, "owner", ["*"], "Other")
    with TestClient(app) as other:
        other.post("/api/v1/core/session", json={"ticket": ticket})
        assert other.get(f"/api/v1/tasks/{task_id}").status_code == 404
        assert other.get("/api/v1/tasks").json()["data"] == []


def test_ticket_expiration_cookie_flags_and_logout(app, client):
    from komorebi_server.core.models import LoginTicket

    ticket = bootstrap(app.state.platform.db, "Owner")
    with app.state.platform.db.transaction() as session:
        for row in session.scalars(select(LoginTicket).where(LoginTicket.used_at.is_(None))):
            row.expires_at = utcnow() - timedelta(seconds=1)
    assert client.post("/api/v1/core/session", json={"ticket": ticket}).status_code == 401
    ticket = bootstrap(app.state.platform.db, "Owner")
    response = client.post("/api/v1/core/session", json={"ticket": ticket})
    client.headers["X-CSRF-Token"] = response.json()["csrfToken"]
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=strict" in cookie
    assert client.delete("/api/v1/core/session").status_code == 204
    assert client.get("/api/v1/core/session").status_code == 401


def test_transaction_rollback_includes_outbox_and_idempotency(app, client):
    ctx = context(app, client)
    db = app.state.platform.db
    with pytest.raises(RuntimeError), db.transaction() as session:

        def fail():
            task = Task(user_id=ctx.actor_id, title="Must roll back")
            session.add(task)
            session.flush()
            record_change(session, ctx, "tasks", "tasks.taskChanged.v1", task.id, 1)
            raise RuntimeError("intentional")

        command(session, ctx, "tasks.fail", "retryable", {}, fail)
    with db.transaction() as session:
        for model in (Task, Outbox, Audit, Idempotency):
            assert session.scalar(select(func.count()).select_from(model)) == 0


def test_preferences_validation_and_idempotency(client):
    headers = {"Idempotency-Key": "prefs", "If-Match": "1"}
    body = {"timeZone": "America/Chicago", "theme": "dark"}
    response = client.put("/api/v1/core/preferences", json=body, headers=headers)
    assert response.status_code == 200, response.text
    assert (
        client.put("/api/v1/core/preferences", json=body, headers=headers).json() == response.json()
    )
    assert client.get("/api/v1/core/preferences").json()["data"]["timeZone"] == "America/Chicago"
    assert (
        client.put(
            "/api/v1/core/preferences", json={"timeZone": "Invalid"}, headers=headers
        ).status_code
        == 422
    )


def test_private_files_and_encrypted_secrets(app, client):
    result = client.post(
        "/api/v1/core/files?name=note.txt",
        content=b"private text",
        headers={"Content-Type": "text/plain"},
    )
    assert result.status_code == 201, result.text
    file_id = result.json()["id"]
    assert client.get(f"/api/v1/core/files/{file_id}").content == b"private text"
    path = app.state.platform.files.root / file_id
    assert path.stat().st_mode & 0o777 == 0o600
    assert client.delete(f"/api/v1/core/files/{file_id}").status_code == 204
    assert not path.exists()
    assert client.get(f"/api/v1/core/files/{file_id}").status_code == 404
    assert (
        client.post(
            "/api/v1/core/files?name=bad.html",
            content=b"<script/>",
            headers={"Content-Type": "text/html"},
        ).status_code
        == 415
    )
    ctx = context(app, client)
    store = SecretStore(app.state.platform.db, Fernet.generate_key().decode())
    secret_id = store.put(ctx, "sensitive-provider-token")
    with app.state.platform.db.transaction() as session:
        assert "sensitive-provider-token" not in session.get(Credential, secret_id).ciphertext
    assert store.read(ctx, secret_id) == "sensitive-provider-token"
    with pytest.raises(AppError):
        store.read(ctx.model_copy(update={"actor_id": new_id()}), secret_id)


def test_origin_limits_errors_and_disabled_module(app, client, settings):
    response = client.post(
        "/api/v1/tasks",
        json={"title": "private"},
        headers={"Origin": "https://evil.invalid", "Idempotency-Key": "x"},
    )
    assert response.status_code == 403
    response = client.post("/api/v1/tasks", content=b"x" * (settings.max_body_bytes + 1))
    assert response.status_code == 413
    response = create_task(client, title=" ")
    assert response.status_code == 422
    assert set(response.json()) == {"code", "message", "correlationId", "retryable"}
    assert response.headers["x-correlation-id"] == response.json()["correlationId"]
    disabled = create_app(
        settings.model_copy(update={"enabled_modules": ["usage"]}), db=app.state.platform.db
    )
    with TestClient(disabled) as other:
        other.cookies.update(client.cookies)
        assert other.get("/api/v1/tasks").status_code == 404
        assert other.get("/api/v1/usage/observations").status_code == 200
