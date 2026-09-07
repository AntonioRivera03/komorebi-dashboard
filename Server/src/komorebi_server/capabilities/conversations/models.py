from datetime import datetime

from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from komorebi_server.core.database import Base, UTCDateTime
from komorebi_server.shared.contracts.common import new_id, utcnow


class Thread(Base):
    __tablename__ = "threads"
    __table_args__ = {"schema": "conversations"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(200))
    revision: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (UniqueConstraint("thread_id", "sequence"), {"schema": "conversations"})
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36))
    thread_id: Mapped[str] = mapped_column(String(36), index=True)
    sequence: Mapped[int]
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    run_id: Mapped[str | None] = mapped_column(String(36), unique=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
