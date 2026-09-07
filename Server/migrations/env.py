import os

from alembic import context
from sqlalchemy import create_engine, pool

from komorebi_server.app import composition  # noqa: F401
from komorebi_server.core.database import Base

url = os.environ.get("KOMOREBI_MIGRATION_DATABASE_URL") or os.environ.get("KOMOREBI_DATABASE_URL")
if not url:
    from dotenv import dotenv_values

    values = dotenv_values(".env")
    url = values.get("KOMOREBI_MIGRATION_DATABASE_URL") or values.get("KOMOREBI_DATABASE_URL")
if not url:
    raise RuntimeError("Set KOMOREBI_MIGRATION_DATABASE_URL or KOMOREBI_DATABASE_URL")
if not url.startswith("postgresql"):
    raise RuntimeError("Migrations require PostgreSQL; SQLite is only a unit-test adapter")


def configure(connection=None):
    context.configure(
        connection=connection,
        url=url,
        target_metadata=Base.metadata,
        include_schemas=True,
        compare_type=True,
        literal_binds=connection is None,
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    configure()
else:
    with create_engine(url, poolclass=pool.NullPool).connect() as connection:
        configure(connection)
