from datetime import datetime

from sqlalchemy import JSON, CheckConstraint, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from komorebi_server.core.database import Base, UTCDateTime
from komorebi_server.shared.contracts.common import utcnow


class LearningWorkspace(Base):
    __tablename__ = "learning_workspaces"
    __table_args__ = (CheckConstraint("revision >= 0"), {"schema": "learn"})
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    revision: Mapped[int] = mapped_column(default=0)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class SourceImport(Base):
    __tablename__ = "source_imports"
    __table_args__ = {"schema": "learn"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    filename: Mapped[str] = mapped_column(String(300))
    data: Mapped[bytes | None] = mapped_column(LargeBinary)
    result: Mapped[dict | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(String(500))
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
