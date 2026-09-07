import hashlib
import secrets
from datetime import timedelta

from fastapi import Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from komorebi_server.core.models import LoginSession, LoginTicket, User
from komorebi_server.shared.contracts.common import AppError, RequestContext, utcnow

DISPLAY_SCOPES = {"calendar:summary", "home:scenes", "today:display"}


def issue_ticket(session: Session, user_id: str, role: str, scopes: list[str], name: str) -> str:
    if role not in {"owner", "display"} or (
        role == "display" and not set(scopes) <= DISPLAY_SCOPES
    ):
        raise AppError("invalid_scopes", "Display pairing contains unsupported scopes.", 422)
    token = secrets.token_urlsafe(32)
    session.add(
        LoginTicket(
            digest=hashlib.sha256(token.encode()).hexdigest(),
            user_id=user_id,
            role=role,
            scopes=["*"] if role == "owner" else scopes,
            name=name,
            expires_at=utcnow() + timedelta(minutes=10),
        )
    )
    return token


def redeem_ticket(session: Session, token: str, hours: int) -> LoginSession:
    digest = hashlib.sha256(token.encode()).hexdigest()
    row = session.execute(
        update(LoginTicket)
        .where(
            LoginTicket.digest == digest,
            LoginTicket.used_at.is_(None),
            LoginTicket.expires_at > utcnow(),
        )
        .values(used_at=utcnow())
        .returning(LoginTicket)
    ).scalar_one_or_none()
    if row is None or session.get(User, row.user_id) is None:
        raise AppError("invalid_ticket", "This sign-in ticket is invalid or expired.", 401)
    result = LoginSession(
        user_id=row.user_id,
        role=row.role,
        scopes=row.scopes,
        name=row.name,
        csrf=secrets.token_urlsafe(32),
        expires_at=utcnow() + timedelta(hours=hours),
    )
    session.add(result)
    session.flush()
    return result


def context_for_session(session: Session, session_id: str, correlation_id: str) -> RequestContext:
    record = session.get(LoginSession, session_id)
    if (
        not record
        or record.revoked_at
        or record.expires_at <= utcnow()
        or not session.get(User, record.user_id)
    ):
        raise AppError("unauthenticated", "Sign in with an active session.", 401)
    return RequestContext(
        actor_id=record.user_id,
        session_id=record.id,
        principal="user" if record.role == "owner" else "display",
        scopes=tuple(record.scopes),
        correlation_id=correlation_id,
    )


def get_context(request: Request) -> RequestContext:
    with request.app.state.platform.db.transaction() as session:
        ctx = context_for_session(
            session, request.session.get("sid", ""), request.state.correlation_id
        )
        record = session.get(LoginSession, ctx.session_id)
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            supplied = request.headers.get("X-CSRF-Token", "")
            if not secrets.compare_digest(supplied, record.csrf):
                raise AppError("csrf_failed", "The CSRF token is missing or invalid.", 403)
    return ctx


def owner(request: Request) -> RequestContext:
    ctx = get_context(request)
    ctx.require("*")
    return ctx


def bootstrap(db, name: str) -> str:
    with db.transaction() as session:
        # Singleton identity bootstrap is serialized on PostgreSQL, including first creation.
        if session.bind.dialect.name == "postgresql":
            from sqlalchemy import text

            session.execute(text("SELECT pg_advisory_xact_lock(72103924)"))
        user = session.scalars(select(User)).first()
        if user is None:
            user = User(name=name)
            session.add(user)
            session.flush()
        return issue_ticket(session, user.id, "owner", ["*"], "Owner browser")
