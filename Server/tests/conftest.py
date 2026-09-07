import pytest
from fastapi.testclient import TestClient

from komorebi_server.app.api import create_app
from komorebi_server.core.config import Settings
from komorebi_server.core.database import Base, Database
from komorebi_server.core.identity import bootstrap


@pytest.fixture
def settings(tmp_path):
    return Settings(
        _env_file=None,
        environment="test",
        session_secret="test-only-" * 8,
        secure_cookies=False,
        file_root=tmp_path / "files",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
    )


@pytest.fixture
def app(settings):
    db = Database(settings.database_url.get_secret_value())
    app = create_app(settings, db=db)
    Base.metadata.create_all(db.engine)
    yield app
    db.engine.dispose()


@pytest.fixture
def client(app):
    with TestClient(app) as client:
        ticket = bootstrap(app.state.platform.db, "Test Owner")
        response = client.post("/api/v1/core/session", json={"ticket": ticket})
        assert response.status_code == 200, response.text
        client.headers["X-CSRF-Token"] = response.json()["csrfToken"]
        yield client
