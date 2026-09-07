import hashlib
import os
from pathlib import Path

from cryptography.fernet import Fernet

from komorebi_server.core.models import Credential, PrivateFile
from komorebi_server.shared.contracts.common import AppError, new_id, utcnow

ALLOWED_TYPES = {
    "text/plain",
    "application/pdf",
    "image/png",
    "image/jpeg",
    "audio/wav",
    "audio/webm",
}


class FileStore:
    def __init__(self, db, root: Path, maximum: int):
        self.db, self.root, self.maximum = db, root.resolve(), maximum

    def put(self, ctx, name: str, content_type: str, data: bytes):
        ctx.require("files:write")
        if content_type not in ALLOWED_TYPES:
            raise AppError("unsupported_media_type", "This file type is not accepted.", 415)
        if len(data) > self.maximum:
            raise AppError("file_too_large", "The file exceeds the configured upload limit.", 413)
        file_id = new_id()
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        path = self.root / file_id
        # Immutable opaque IDs, exclusive creation and private permissions; no user path input.
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(fd, "wb") as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            with self.db.transaction() as session:
                row = PrivateFile(
                    id=file_id,
                    user_id=ctx.actor_id,
                    name=Path(name).name[:200],
                    content_type=content_type,
                    size=len(data),
                    sha256=hashlib.sha256(data).hexdigest(),
                )
                session.add(row)
            return row
        except Exception:
            path.unlink(missing_ok=True)
            raise

    def get(self, ctx, file_id):
        ctx.require("files:read")
        with self.db.transaction() as session:
            row = session.get(PrivateFile, file_id)
            if not row or row.user_id != ctx.actor_id or row.deleted_at:
                raise AppError("not_found", "File not found.", 404)
            path = self.root / row.id
            if not path.is_file():
                raise AppError(
                    "file_unavailable", "File bytes are unavailable; check storage.", 503
                )
            return row, path

    def delete(self, ctx, file_id):
        ctx.require("files:write")
        row, path = self.get(ctx, file_id)
        with self.db.transaction() as session:
            session.get(PrivateFile, row.id).deleted_at = utcnow()
        path.unlink(missing_ok=True)


class SecretStore:
    def __init__(self, db, key: str | None):
        self.db = db
        self.cipher = Fernet(key.encode()) if key else None

    def put(self, ctx, value: str) -> str:
        ctx.require("credentials:write")
        if not self.cipher:
            raise AppError(
                "encryption_not_configured", "Configure an external encryption key.", 503
            )
        with self.db.transaction() as session:
            row = Credential(
                user_id=ctx.actor_id, ciphertext=self.cipher.encrypt(value.encode()).decode()
            )
            session.add(row)
            session.flush()
            return row.id

    def read(self, ctx, credential_id: str) -> str:
        # Internal adapter port only. No HTTP endpoint ever returns decrypted credentials.
        ctx.require("credentials:read")
        if not self.cipher:
            raise AppError(
                "encryption_not_configured", "Configure an external encryption key.", 503
            )
        with self.db.transaction() as session:
            row = session.get(Credential, credential_id)
            if not row or row.user_id != ctx.actor_id:
                raise AppError("not_found", "Credential not found.", 404)
            return self.cipher.decrypt(row.ciphertext.encode()).decode()
