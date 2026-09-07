"""Platform-owned persistence only. Capability tables live with their owners."""

from datetime import datetime

from sqlalchemy import JSON, CheckConstraint, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from komorebi_server.core.database import Base, UTCDateTime
from komorebi_server.shared.contracts.common import new_id, utcnow


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class LoginTicket(Base):
    __tablename__ = "login_tickets"
    __table_args__ = {"schema": "platform"}
    digest: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36))
    role: Mapped[str] = mapped_column(String(16))
    scopes: Mapped[list] = mapped_column(JSON)
    name: Mapped[str] = mapped_column(String(100))
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    used_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class LoginSession(Base):
    __tablename__ = "sessions"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    role: Mapped[str] = mapped_column(String(16))
    scopes: Mapped[list] = mapped_column(JSON)
    name: Mapped[str] = mapped_column(String(100))
    csrf: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Preference(Base):
    __tablename__ = "preferences"
    __table_args__ = {"schema": "platform"}
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    revision: Mapped[int] = mapped_column(default=1)
    values: Mapped[dict] = mapped_column(JSON)


class Idempotency(Base):
    __tablename__ = "idempotency"
    __table_args__ = {"schema": "platform"}
    actor_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    operation: Mapped[str] = mapped_column(String(200), primary_key=True)
    key: Mapped[str] = mapped_column(String(128), primary_key=True)
    payload_hash: Mapped[str] = mapped_column(String(64))
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Audit(Base):
    __tablename__ = "audit"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    actor_id: Mapped[str] = mapped_column(String(36), index=True)
    action: Mapped[str] = mapped_column(String(200))
    resource_id: Mapped[str] = mapped_column(String(36))
    correlation_id: Mapped[str] = mapped_column(String(36))
    at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Outbox(Base):
    __tablename__ = "outbox"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    module: Mapped[str] = mapped_column(String(60))
    type: Mapped[str] = mapped_column(String(150))
    actor_id: Mapped[str] = mapped_column(String(36), index=True)
    session_id: Mapped[str] = mapped_column(String(36))
    correlation_id: Mapped[str] = mapped_column(String(36))
    aggregate_id: Mapped[str] = mapped_column(String(36))
    aggregate_revision: Mapped[int] = mapped_column(Integer)
    payload: Mapped[dict] = mapped_column(JSON)
    occurred_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    dispatched_at: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint("attempts >= 0 AND max_attempts > 0"),
        Index("ix_jobs_claim", "status", "available_at", "lease_until"),
        {"schema": "platform"},
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    dedupe_key: Mapped[str] = mapped_column(String(250), unique=True)
    module: Mapped[str] = mapped_column(String(60))
    type: Mapped[str] = mapped_column(String(150))
    actor_id: Mapped[str] = mapped_column(String(36))
    session_id: Mapped[str] = mapped_column(String(36))
    correlation_id: Mapped[str] = mapped_column(String(36))
    payload: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(24), default="queued")
    attempts: Mapped[int] = mapped_column(default=0)
    max_attempts: Mapped[int] = mapped_column(default=5)
    external: Mapped[bool] = mapped_column(default=False)
    available_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    lease_until: Mapped[datetime | None] = mapped_column(UTCDateTime)
    lease_token: Mapped[str | None] = mapped_column(String(36))
    last_error: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Receipt(Base):
    __tablename__ = "receipts"
    __table_args__ = {"schema": "platform"}
    consumer: Mapped[str] = mapped_column(String(100), primary_key=True)
    event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Heartbeat(Base):
    __tablename__ = "heartbeats"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    at: Mapped[datetime] = mapped_column(UTCDateTime)


class PrivateFile(Base):
    __tablename__ = "files"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    name: Mapped[str] = mapped_column(String(200))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class Credential(Base):
    __tablename__ = "credentials"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36))
    ciphertext: Mapped[str] = mapped_column(Text)


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (UniqueConstraint("user_id", "dedupe_key"), {"schema": "platform"})
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    dedupe_key: Mapped[str] = mapped_column(String(200))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    read_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class AIBudget(Base):
    __tablename__ = "ai_budgets"
    __table_args__ = (CheckConstraint("used >= 0 AND reserved >= 0"), {"schema": "platform"})
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    month: Mapped[str] = mapped_column(String(7), primary_key=True)
    used: Mapped[int] = mapped_column(default=0)
    reserved: Mapped[int] = mapped_column(default=0)


class AIRun(Base):
    __tablename__ = "ai_runs"
    __table_args__ = {"schema": "platform"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    month: Mapped[str] = mapped_column(String(7))
    status: Mapped[str] = mapped_column(String(30))
    reserved_units: Mapped[int] = mapped_column(Integer)
    used_units: Mapped[int | None] = mapped_column(Integer)
    provider: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    error: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
