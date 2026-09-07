from dataclasses import dataclass

from komorebi_server.core.ai import AIGateway
from komorebi_server.core.config import Settings
from komorebi_server.core.database import Database, insert_once
from komorebi_server.core.models import Notification
from komorebi_server.core.storage import FileStore, SecretStore
from komorebi_server.shared.contracts.common import new_id


@dataclass
class Platform:
    settings: Settings
    db: Database
    files: FileStore
    secrets: SecretStore
    ai: AIGateway

    @staticmethod
    def notify(session, ctx, dedupe_key: str, title: str, body: str):
        ctx.require("notifications:write")
        insert_once(
            session,
            Notification.__table__,
            dict(
                id=new_id(),
                user_id=ctx.actor_id,
                dedupe_key=dedupe_key,
                title=title,
                body=body,
            ),
            ["user_id", "dedupe_key"],
        )
