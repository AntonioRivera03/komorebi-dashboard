from datetime import datetime

from sqlalchemy import CheckConstraint, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from komorebi_server.core.database import Base, UTCDateTime
from komorebi_server.shared.contracts.common import new_id, utcnow


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("revision > 0"),
        CheckConstraint("status IN ('open', 'in_progress', 'completed', 'canceled')"),
        CheckConstraint("estimate_minutes IS NULL OR estimate_minutes > 0"),
        Index("ix_tasks_owner_status", "user_id", "status", "id"),
        {"schema": "tasks"},
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36))
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")
    due_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    estimate_minutes: Mapped[int | None]
    effort: Mapped[str | None] = mapped_column(String(10))
    context: Mapped[str | None] = mapped_column(String(100))
    priority: Mapped[bool] = mapped_column(default=False)
    revision: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    deleted_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class TaskChange(Base):
    __tablename__ = "changes"
    __table_args__ = {"schema": "tasks"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36))
    task_id: Mapped[str] = mapped_column(String(36), index=True)
    kind: Mapped[str] = mapped_column(String(30))
    revision: Mapped[int]
    at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
