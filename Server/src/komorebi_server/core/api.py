from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import FileResponse
from pydantic import Field, field_validator
from sqlalchemy import select

from komorebi_server.core.http import IdempotencyKey, revision
from komorebi_server.core.identity import get_context, issue_ticket, owner, redeem_ticket
from komorebi_server.core.models import Audit, Job, LoginSession, Notification, Preference, User
from komorebi_server.core.transactions import command
from komorebi_server.shared.contracts.common import (
    AppError,
    Completed,
    Contract,
    RequestContext,
    Snapshot,
    utcnow,
)

Context = Annotated[RequestContext, Depends(get_context)]
Owner = Annotated[RequestContext, Depends(owner)]


class TicketInput(Contract):
    ticket: str = Field(min_length=40, max_length=100)


class SessionView(Contract):
    actor_id: str
    session_id: str
    display_name: str
    principal: Literal["user", "display"]
    scopes: list[str]
    csrf_token: str
    expires_at: datetime


class PairInput(Contract):
    name: str = Field(min_length=1, max_length=100)
    scopes: list[str] = Field(default_factory=lambda: ["today:display"], max_length=20)


class PairResult(Contract):
    ticket: str
    expires_in_seconds: int = 600


class QuietHours(Contract):
    from_: str = Field(default="22:00", alias="from", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    to: str = Field(default="07:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


class Preferences(Contract):
    time_zone: str = "UTC"
    locale: str = Field(default="en-US", min_length=2, max_length=35)
    theme: Literal["light", "dark", "system"] = "system"
    quiet_hours: QuietHours = Field(default_factory=QuietHours)
    raw_audio_retention: Literal["delete_after_transcription", "keep_on_save"] = (
        "delete_after_transcription"
    )

    @field_validator("time_zone")
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ValueError, ZoneInfoNotFoundError):
            raise ValueError("Use an IANA time zone") from None
        return value


class PreferencesView(Preferences):
    revision: int


class DeviceView(Contract):
    id: str
    name: str
    role: str
    scopes: list[str]
    expires_at: datetime
    revoked_at: datetime | None


class JobView(Contract):
    id: str
    module: str
    type: str
    status: str
    attempts: int
    max_attempts: int
    external: bool
    last_error: str | None
    available_at: datetime


class NotificationView(Contract):
    id: str
    title: str
    body: str
    created_at: datetime
    read_at: datetime | None


class FileView(Contract):
    id: str
    name: str
    content_type: str
    size: int
    sha256: str


def dto(model, row):
    return model.model_validate({k: getattr(row, k) for k in model.model_fields})


def create_router(platform, modules):
    router = APIRouter(prefix="/api/v1/core", tags=["core"])

    def session_view(session, record):
        user = session.get(User, record.user_id)
        return SessionView(
            actor_id=user.id,
            session_id=record.id,
            display_name=user.name,
            principal="user" if record.role == "owner" else "display",
            scopes=record.scopes,
            csrf_token=record.csrf,
            expires_at=record.expires_at,
        )

    @router.post("/session", response_model=SessionView)
    def login(body: TicketInput, request: Request):
        with platform.db.transaction() as session:
            record = redeem_ticket(session, body.ticket, platform.settings.session_hours)
            # Session fixation defense: discard any previously signed browser state.
            request.session.clear()
            request.session["sid"] = record.id
            return session_view(session, record)

    @router.get("/session", response_model=SessionView)
    def current(ctx: Context):
        with platform.db.transaction() as session:
            return session_view(session, session.get(LoginSession, ctx.session_id))

    @router.delete("/session", status_code=204)
    def logout(ctx: Context, request: Request):
        with platform.db.transaction() as session:
            session.get(LoginSession, ctx.session_id).revoked_at = utcnow()
        request.session.clear()
        return Response(status_code=204)

    @router.post("/pairings", response_model=PairResult, status_code=201)
    def pair(body: PairInput, ctx: Owner):
        with platform.db.transaction() as session:
            return PairResult(
                ticket=issue_ticket(session, ctx.actor_id, "display", body.scopes, body.name)
            )

    @router.get("/devices", response_model=Snapshot[list[DeviceView]])
    def devices(
        ctx: Owner, limit: Annotated[int, Query(ge=1, le=100)] = 50, cursor: UUID | None = None
    ):
        with platform.db.transaction() as session:
            query = select(LoginSession).where(LoginSession.user_id == ctx.actor_id)
            if cursor:
                query = query.where(LoginSession.id > str(cursor))
            rows = session.scalars(query.order_by(LoginSession.id).limit(limit + 1)).all()
            return Snapshot(
                data=[dto(DeviceView, r) for r in rows[:limit]],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    @router.delete("/devices/{device_id}", status_code=204)
    def revoke(device_id: UUID, ctx: Owner):
        with platform.db.transaction() as session:
            row = session.get(LoginSession, str(device_id))
            if not row or row.user_id != ctx.actor_id:
                raise AppError("not_found", "Device not found.", 404)
            row.revoked_at = utcnow()
            session.add(
                Audit(
                    actor_id=ctx.actor_id,
                    action="core.sessionRevoked.v1",
                    resource_id=row.id,
                    correlation_id=ctx.correlation_id,
                )
            )
        return Response(status_code=204)

    @router.get("/preferences", response_model=Snapshot[PreferencesView])
    def preferences(ctx: Owner):
        with platform.db.transaction() as session:
            row = session.get(Preference, ctx.actor_id)
            return Snapshot(
                data=PreferencesView(
                    **(row.values if row else {}), revision=row.revision if row else 1
                )
            )

    @router.put("/preferences", response_model=Completed[PreferencesView])
    def set_preferences(
        body: Preferences,
        ctx: Owner,
        key: IdempotencyKey,
        expected: Annotated[int, Depends(revision)],
    ):
        with platform.db.transaction() as session:

            def execute():
                # Lock a stable parent even before the first preferences row exists.
                session.scalar(select(User).where(User.id == ctx.actor_id).with_for_update())
                row = session.get(Preference, ctx.actor_id)
                if expected != (row.revision if row else 1):
                    raise AppError("revision_conflict", "Reload preferences before saving.")
                if row is None:
                    row = Preference(user_id=ctx.actor_id, revision=1, values={})
                    session.add(row)
                row.revision += 1
                row.values = body.model_dump(mode="json", by_alias=True)
                return Completed(
                    value=PreferencesView(**row.values, revision=row.revision)
                ).model_dump(mode="json", by_alias=True)

            return command(
                session,
                ctx,
                "core.preferences",
                key,
                {"body": body.model_dump(mode="json"), "revision": expected},
                execute,
            )

    @router.get("/modules")
    def module_status(ctx: Owner):
        return {
            "data": [
                {
                    "id": m.name,
                    "schema": m.schema,
                    "enabled": True,
                    "requires": m.requires,
                    "provides": m.provides,
                    "permissions": m.permissions,
                }
                for m in modules
            ]
        }

    @router.get("/providers")
    def provider_status(ctx: Owner):
        return {
            "ai": {
                "status": "configured" if platform.ai.provider else "needs_setup",
                "disclosureAllowed": platform.settings.ai_disclosure_allowed,
                "monthlyBudgetUnits": platform.settings.ai_monthly_budget_units,
            },
            "externalJobsEnabled": platform.settings.external_jobs_enabled,
        }

    @router.get("/jobs", response_model=Snapshot[list[JobView]])
    def jobs(
        ctx: Owner, limit: Annotated[int, Query(ge=1, le=100)] = 50, cursor: UUID | None = None
    ):
        with platform.db.transaction() as session:
            query = select(Job).where(Job.actor_id == ctx.actor_id)
            if cursor:
                query = query.where(Job.id > str(cursor))
            rows = session.scalars(query.order_by(Job.id).limit(limit + 1)).all()
            return Snapshot(
                data=[dto(JobView, r) for r in rows[:limit]],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    @router.get("/jobs/{job_id}", response_model=Snapshot[JobView])
    def job(job_id: UUID, ctx: Owner):
        with platform.db.transaction() as session:
            row = session.get(Job, str(job_id))
            if not row or row.actor_id != ctx.actor_id:
                raise AppError("not_found", "Job not found.", 404)
            return Snapshot(data=dto(JobView, row))

    @router.post("/jobs/{job_id}/retry", response_model=Completed[JobView])
    def retry(job_id: UUID, ctx: Owner, key: IdempotencyKey):
        with platform.db.transaction() as session:

            def execute():
                row = session.scalar(select(Job).where(Job.id == str(job_id)).with_for_update())
                if not row or row.actor_id != ctx.actor_id:
                    raise AppError("not_found", "Job not found.", 404)
                if (
                    row.external
                    or row.status != "failed"
                    or row.module not in {m.name for m in modules}
                ):
                    raise AppError(
                        "retry_not_allowed", "Only failed local jobs may be retried here."
                    )
                row.status, row.attempts, row.last_error = "queued", 0, None
                row.session_id = ctx.session_id
                row.available_at = utcnow()
                return Completed(value=dto(JobView, row)).model_dump(mode="json", by_alias=True)

            return command(session, ctx, f"core.retry:{job_id}", key, {}, execute)

    @router.get("/notifications", response_model=Snapshot[list[NotificationView]])
    def notifications(
        ctx: Owner, limit: Annotated[int, Query(ge=1, le=100)] = 50, cursor: UUID | None = None
    ):
        with platform.db.transaction() as session:
            query = select(Notification).where(Notification.user_id == ctx.actor_id)
            if cursor:
                query = query.where(Notification.id > str(cursor))
            rows = session.scalars(query.order_by(Notification.id).limit(limit + 1)).all()
            return Snapshot(
                data=[dto(NotificationView, r) for r in rows[:limit]],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    @router.post("/notifications/{notification_id}/read", status_code=204)
    def read_notification(notification_id: UUID, ctx: Owner):
        with platform.db.transaction() as session:
            row = session.get(Notification, str(notification_id))
            if not row or row.user_id != ctx.actor_id:
                raise AppError("not_found", "Notification not found.", 404)
            row.read_at = row.read_at or utcnow()
        return Response(status_code=204)

    @router.post("/files", response_model=FileView, status_code=201)
    async def upload(request: Request, ctx: Owner, name: Annotated[str, Query(max_length=200)]):
        # Raw upload body avoids multipart parser and user-supplied storage paths.
        data = await request.body()
        from starlette.concurrency import run_in_threadpool

        row = await run_in_threadpool(
            platform.files.put, ctx, name, request.headers.get("content-type", ""), data
        )
        return dto(FileView, row)

    @router.get("/files/{file_id}")
    def download(file_id: UUID, ctx: Owner):
        row, path = platform.files.get(ctx, str(file_id))
        return FileResponse(
            path,
            filename=row.name,
            media_type="application/octet-stream",
            headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"},
        )

    @router.delete("/files/{file_id}", status_code=204)
    def delete_file(file_id: UUID, ctx: Owner):
        platform.files.delete(ctx, str(file_id))
        return Response(status_code=204)

    return router
