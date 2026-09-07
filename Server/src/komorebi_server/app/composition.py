"""The sole place allowed to import and assemble different capabilities."""

from komorebi_server.capabilities.conversations.bootstrap import create_module as conversations
from komorebi_server.capabilities.learn.bootstrap import create_module as learn
from komorebi_server.capabilities.tasks.bootstrap import create_module as tasks
from komorebi_server.capabilities.usage.bootstrap import create_module as usage
from komorebi_server.core.ai import AIGateway
from komorebi_server.core.database import Database
from komorebi_server.core.modules import validate_modules
from komorebi_server.core.platform import Platform
from komorebi_server.core.storage import FileStore, SecretStore


def compose(settings, *, db=None, ai_provider=None, include_disabled=False):
    db = db or Database(settings.database_url.get_secret_value())
    platform = Platform(
        settings=settings,
        db=db,
        files=FileStore(db, settings.file_root, settings.max_upload_bytes),
        secrets=SecretStore(
            db, settings.encryption_key.get_secret_value() if settings.encryption_key else None
        ),
        ai=AIGateway(db, settings, ai_provider),
    )
    factories = {"tasks": tasks, "usage": usage, "conversations": conversations, "learn": learn}
    unknown = set(settings.enabled_modules) - factories.keys()
    if unknown:
        raise ValueError(f"Unknown modules: {', '.join(sorted(unknown))}")
    enabled = list(factories) if include_disabled else settings.enabled_modules
    modules = validate_modules([factories[name](platform) for name in enabled])
    return platform, modules
