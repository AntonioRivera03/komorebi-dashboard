"""Local operator commands. Access to this process is privileged access to the installation."""

import argparse
import json
import os
import secrets
import zipfile
from pathlib import Path

from cryptography.fernet import Fernet
from sqlalchemy import select

from komorebi_server.app.composition import compose
from komorebi_server.core.config import Settings
from komorebi_server.core.identity import bootstrap
from komorebi_server.core.models import PrivateFile, User
from komorebi_server.shared.contracts.common import RequestContext, new_id, utcnow


def run():
    parser = argparse.ArgumentParser(prog="komorebi-admin")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("init", help="Create a private development .env (never overwrite one)")
    login = commands.add_parser("login", help="Print a single-use owner sign-in ticket")
    login.add_argument("--name", default="Owner")
    export = commands.add_parser(
        "export", help="Export module records and original files, no secrets"
    )
    export.add_argument("path", type=Path)
    commands.add_parser("openapi", help="Write OpenAPI JSON to standard output")
    args = parser.parse_args()
    if args.command == "init":
        content = (
            "KOMOREBI_DATABASE_URL=postgresql+psycopg://komorebi:komorebi@127.0.0.1:5432/komorebi\n"
            f"KOMOREBI_SESSION_SECRET={secrets.token_urlsafe(48)}\n"
            f"KOMOREBI_ENCRYPTION_KEY={Fernet.generate_key().decode()}\n"
            "KOMOREBI_SECURE_COOKIES=false\nKOMOREBI_ENVIRONMENT=development\n"
        )
        fd = os.open(".env", os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(content)
        print("Created private .env. Configure PostgreSQL, then run migrations.")
        return
    settings = Settings()
    if args.command == "openapi":
        from komorebi_server.app.api import create_app

        print(json.dumps(create_app(settings).openapi(), indent=2))
        return
    platform, modules = compose(settings, include_disabled=args.command == "export")
    try:
        if args.command == "login":
            print(bootstrap(platform.db, args.name))
            return
        with platform.db.transaction() as session:
            user = session.scalars(select(User)).one()
            files = session.scalars(
                select(PrivateFile).where(
                    PrivateFile.user_id == user.id, PrivateFile.deleted_at.is_(None)
                )
            ).all()
        ctx = RequestContext(
            actor_id=user.id,
            session_id="local-export",
            principal="user",
            scopes=("*",),
            correlation_id=new_id(),
        )
        fd = os.open(args.path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(fd, "wb") as stream, zipfile.ZipFile(stream, "w") as archive:
                manifest = {
                    "schemaVersion": 1,
                    "exportedAt": utcnow().isoformat(),
                    "user": {"id": user.id, "name": user.name},
                    "modules": [m.name for m in modules],
                    "files": [],
                }
                from komorebi_server.core.portability import export_platform

                archive.writestr("platform.json", json.dumps(export_platform(platform.db, ctx)))
                for module in modules:
                    if module.export:
                        archive.writestr(f"{module.name}.json", json.dumps(module.export(ctx)))
                for row in files:
                    archive.write(platform.files.root / row.id, f"files/{row.id}")
                    manifest["files"].append(
                        {"id": row.id, "name": row.name, "sha256": row.sha256, "size": row.size}
                    )
                archive.writestr("manifest.json", json.dumps(manifest, indent=2))
        except Exception:
            args.path.unlink(missing_ok=True)
            raise
        print(f"Exported {args.path}")
    finally:
        platform.db.engine.dispose()
