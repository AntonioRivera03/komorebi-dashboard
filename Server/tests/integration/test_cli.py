import json
import sys
import zipfile

import pytest

from komorebi_server.app.cli import run
from tests.integration.test_core import context, create_task


def test_init_refuses_overwrite_and_export_excludes_secrets(app, client, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(sys, "argv", ["komorebi-admin", "init"])
    run()
    env = tmp_path / ".env"
    assert env.stat().st_mode & 0o777 == 0o600
    original = env.read_bytes()
    with pytest.raises(FileExistsError):
        run()
    assert env.read_bytes() == original

    settings = app.state.platform.settings
    monkeypatch.setenv("KOMOREBI_DATABASE_URL", settings.database_url.get_secret_value())
    monkeypatch.setenv("KOMOREBI_SESSION_SECRET", settings.session_secret.get_secret_value())
    monkeypatch.setenv("KOMOREBI_ENVIRONMENT", "test")
    monkeypatch.setenv("KOMOREBI_FILE_ROOT", str(settings.file_root))
    monkeypatch.setenv("KOMOREBI_ENABLED_MODULES", '["tasks"]')
    create_task(client, title="Export this task")
    ctx = context(app, client)
    file = app.state.platform.files.put(ctx, "source.txt", "text/plain", b"Original source")
    output = tmp_path / "private.zip"
    monkeypatch.setattr(sys, "argv", ["komorebi-admin", "export", str(output)])
    run()
    assert output.stat().st_mode & 0o777 == 0o600
    with zipfile.ZipFile(output) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        assert set(manifest["modules"]) == {"tasks", "usage", "conversations", "learn"}
        assert archive.read(f"files/{file.id}") == b"Original source"
        platform = json.loads(archive.read("platform.json"))
        assert set(platform) == {"preferences", "notifications", "ai_runs", "audit"}
        assert b"Export this task" in archive.read("tasks.json")
        assert not any("credential" in name or "session" in name for name in archive.namelist())
    with pytest.raises(FileExistsError):
        run()
