from copy import deepcopy

from fastapi.testclient import TestClient

from komorebi_server.app.api import create_app
from komorebi_server.core.identity import bootstrap
from komorebi_server.shared.contracts.learn import LearnWorkspace


def workspace():
    return LearnWorkspace.model_validate(
        {
            "sessions": [
                {
                    "id": "subject",
                    "title": "Cognition",
                    "description": "",
                    "topics": ["Memory"],
                    "symbol": "◒",
                }
            ],
            "materials": [
                {
                    "id": "source",
                    "sessionId": "subject",
                    "kind": "source",
                    "title": "Reading",
                    "topic": "Memory",
                    "content": "A 🧠 remembers. A 🧠 remembers.",
                }
            ],
            "highlights": [
                {
                    "id": "highlight",
                    "sourceId": "source",
                    "start": 16,
                    "end": 31,
                    "quote": "A 🧠 remembers.",
                    "createdAt": 1000,
                }
            ],
            "artifacts": [
                {
                    "id": "artifact",
                    "sessionId": "subject",
                    "topic": "Memory",
                    "body": "A 🧠 remembers.",
                    "updatedAt": 1000,
                    "highlightId": "highlight",
                }
            ],
            "deckDrafts": [
                {
                    "id": "draft",
                    "sessionId": "subject",
                    "title": "Memory deck",
                    "topic": "Memory",
                    "createdAt": 1000,
                    "updatedAt": 1000,
                    "cards": [
                        {
                            "id": "card",
                            "artifactId": "artifact",
                            "topic": "Memory",
                            "front": "",
                            "back": "A 🧠 remembers.",
                        }
                    ],
                }
            ],
        }
    ).model_dump(mode="json", by_alias=True, exclude_none=True)


def save(client, data, revision=0, key="save"):
    return client.put(
        "/api/v1/learn/workspace",
        json=data,
        headers={"If-Match": str(revision), "Idempotency-Key": key},
    )


def test_learning_round_trip_publication_quiz_history_and_retries(client, app):
    assert client.get("/api/v1/learn/workspace").json()["data"]["revision"] == 0
    data = workspace()
    response = save(client, data)
    assert response.status_code == 200, response.text
    assert save(client, data).json() == response.json()
    assert client.get("/api/v1/learn/workspace").json()["data"]["workspace"] == data
    assert save(client, data, key="different").status_code == 409
    data["deckDrafts"][0]["cards"][0]["front"] = "What remembers?"
    data["deckDrafts"][0]["publishedDeckId"] = "draft"
    data["decks"] = [
        {"id": "draft", "sessionId": "subject", "title": "Memory deck", "topic": "Memory"}
    ]
    data["cards"] = [
        {
            **data["deckDrafts"][0]["cards"][0],
            "deckId": "draft",
            "repetitions": 0,
            "interval": 0,
            "ease": 2.5,
            "dueAt": 1000,
        }
    ]
    questions = [
        {"id": "question", "cardId": "card", "front": "What remembers?", "back": "A 🧠 remembers."}
    ]
    data["materials"].append(
        {
            "id": "quiz",
            "kind": "quiz",
            "sessionId": "subject",
            "title": "Quiz",
            "topic": "Memory",
            "content": "1 question",
            "questions": questions,
        }
    )
    data["quizAttempts"] = [
        {
            "id": "attempt",
            "quizId": "quiz",
            "at": 2000,
            "questions": questions,
            "answers": {"question": "A brain"},
        }
    ]
    assert save(client, data, 1, "publish").status_code == 200
    # New API instance, same database, same authenticated cookie: persistence is not process memory.
    fresh_app = create_app(app.state.platform.settings, db=app.state.platform.db)
    with TestClient(fresh_app) as other:
        other.cookies.update(client.cookies)
        assert other.get("/api/v1/learn/workspace").json()["data"]["workspace"] == data
    modified = deepcopy(data)
    modified["quizAttempts"] = []
    assert save(client, modified, 2, "erase-history").json()["code"] == "history_conflict"
    modified = deepcopy(data)
    modified["materials"][0]["content"] += " changed"
    assert save(client, modified, 2, "edit-source").json()["code"] == "source_conflict"
    assert client.get("/api/v1/learn/workspace").json()["data"]["revision"] == 2


def test_learning_validation_does_not_commit_partial_changes(client):
    data = workspace()
    data["highlights"][0]["quote"] = "Incorrect passage"
    assert save(client, data).status_code == 422
    assert client.get("/api/v1/learn/workspace").json()["data"]["revision"] == 0
    data = workspace()
    data["artifacts"][0]["highlightId"] = "missing"
    assert save(client, data).status_code == 422
    data = workspace()
    data["sessions"].append(data["sessions"][0])
    assert save(client, data).status_code == 422
    data = workspace()
    data["materials"][0]["url"] = "javascript:alert(1)"
    assert save(client, data).status_code == 422
    assert save(client, workspace()).status_code == 200


def test_learn_only_composition_scopes_csrf_and_disable(settings):
    from komorebi_server.core.database import Base, Database

    settings = settings.model_copy(update={"enabled_modules": ["learn"]})
    db = Database(settings.database_url.get_secret_value())
    app = create_app(settings, db=db)
    Base.metadata.create_all(db.engine)
    with TestClient(app) as client:
        assert client.get("/api/v1/learn/workspace").status_code == 401
        ticket = bootstrap(db, "Learn Owner")
        login = client.post("/api/v1/core/session", json={"ticket": ticket}).json()
        assert save(client, workspace()).status_code == 403
        client.headers["X-CSRF-Token"] = login["csrfToken"]
        assert save(client, workspace()).status_code == 200
        assert client.get("/api/v1/tasks").status_code == 404
        pairing = client.post("/api/v1/core/pairings", json={"name": "Display"}).json()
        with TestClient(app) as display:
            display.post("/api/v1/core/session", json={"ticket": pairing["ticket"]})
            assert display.get("/api/v1/learn/workspace").status_code == 403
        disabled = create_app(settings.model_copy(update={"enabled_modules": []}), db=db)
        with TestClient(disabled) as other:
            other.cookies.update(client.cookies)
            assert other.get("/api/v1/learn/workspace").status_code == 404
        assert client.get("/api/v1/learn/workspace").json()["data"]["workspace"]["highlights"]
        result = client.delete(
            "/api/v1/learn/workspace", headers={"If-Match": "1", "Idempotency-Key": "delete"}
        )
        assert result.status_code == 200
        assert client.get("/api/v1/learn/workspace").json()["data"]["workspace"]["sessions"] == []
    db.engine.dispose()
