"""Transaction factory. Migrations are an explicit deployment step, never API startup."""

from contextlib import contextmanager
from datetime import UTC

from sqlalchemy import DateTime, create_engine, event, literal
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator


class UTCDateTime(TypeDecorator):
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None and value.tzinfo is None:
            raise ValueError("An aware UTC instant is required")
        return value.astimezone(UTC) if value else None

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=UTC) if value and value.tzinfo is None else value


class Base(DeclarativeBase):
    pass


class Database:
    def __init__(self, url: str):
        options = {"pool_pre_ping": True}
        if url.startswith("sqlite"):
            # Test adapter only. Production always retains owned PostgreSQL schemas.
            options.update(connect_args={"check_same_thread": False})
        self.engine = create_engine(url, **options)
        if self.engine.dialect.name == "sqlite":
            self.engine = self.engine.execution_options(
                schema_translate_map={
                    s: None for s in ("platform", "tasks", "usage", "conversations", "learn")
                }
            )

            @event.listens_for(self.engine, "connect")
            def sqlite_constraints(connection, _):
                connection.execute("PRAGMA foreign_keys=ON")
                connection.execute("PRAGMA busy_timeout=10000")

        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    @contextmanager
    def transaction(self):
        with self.sessions() as session, session.begin():
            yield session


def insert_once(session: Session, table, values: dict, keys: list[str]) -> bool:
    """Atomic uniqueness arbitration, including competing PostgreSQL transactions."""
    if session.bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert
    else:
        from sqlalchemy.dialects.sqlite import insert
    result = session.execute(
        insert(table)
        .values(**values)
        .on_conflict_do_nothing(index_elements=keys)
        .returning(literal(1))
    )
    return result.scalar_one_or_none() == 1
