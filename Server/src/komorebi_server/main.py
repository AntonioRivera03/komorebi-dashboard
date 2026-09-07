"""API entrypoint; use an application factory so imports have no configuration side effects."""

from komorebi_server.app.api import create_app

__all__ = ["create_app", "run"]


def run() -> None:
    import uvicorn

    uvicorn.run("komorebi_server.main:create_app", factory=True, host="127.0.0.1", port=8000)
