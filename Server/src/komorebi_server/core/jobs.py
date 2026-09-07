"""At-least-once execution with lease fencing and transactional local event effects."""

import logging
from datetime import timedelta

from sqlalchemy import and_, or_, select, update

from komorebi_server.core.database import insert_once
from komorebi_server.core.identity import context_for_session
from komorebi_server.core.models import Heartbeat, Job, Outbox, Receipt
from komorebi_server.shared.contracts.common import AppError, new_id, utcnow

log = logging.getLogger(__name__)


def job_status(session, ctx, job_id):
    job = session.get(Job, job_id)
    if job is None or job.actor_id != ctx.actor_id:
        raise AppError("not_found", "Processing job not found.", 404)
    return job.status


def cancel_job(session, ctx, job_id):
    job_status(session, ctx, job_id)
    session.execute(
        update(Job)
        .where(Job.id == job_id, Job.status.in_(["queued", "running"]))
        .values(status="canceled", lease_token=None, lease_until=None)
    )


def enqueue(session, ctx, module, job_type, payload, dedupe_key, *, external=False):
    job_id = new_id()
    inserted = insert_once(
        session,
        Job.__table__,
        dict(
            id=job_id,
            dedupe_key=dedupe_key,
            module=module,
            type=job_type,
            actor_id=ctx.actor_id,
            session_id=ctx.session_id,
            correlation_id=ctx.correlation_id,
            payload=payload,
            external=external,
        ),
        ["dedupe_key"],
    )
    if not inserted:
        job_id = session.scalar(select(Job.id).where(Job.dedupe_key == dedupe_key))
    return job_id


class Worker:
    def __init__(self, platform, modules):
        self.platform = platform
        self.modules = {m.name for m in modules}
        self.handlers = {k: v for m in modules for k, v in m.jobs.items()}
        self.subscriptions = {s.consumer: (m.name, s) for m in modules for s in m.subscriptions}
        self.id = new_id()
        self.maintenance = [m.maintenance for m in modules if m.maintenance]

    def dispatch(self):
        with self.platform.db.transaction() as session:
            rows = session.scalars(
                select(Outbox)
                .where(Outbox.dispatched_at.is_(None), Outbox.module.in_(self.modules))
                .order_by(Outbox.occurred_at)
                .limit(100)
                .with_for_update(skip_locked=True)
            ).all()
            for event in rows:
                for consumer, (module, sub) in self.subscriptions.items():
                    if sub.event_type != event.type:
                        continue
                    # Receipt and consumer effects commit together in process_job.
                    insert_once(
                        session,
                        Job.__table__,
                        dict(
                            id=new_id(),
                            dedupe_key=f"event:{consumer}:{event.id}",
                            module=module,
                            type="platform.event.v1",
                            actor_id=event.actor_id,
                            session_id=event.session_id,
                            correlation_id=event.correlation_id,
                            payload={"consumer": consumer, "eventId": event.id},
                            external=False,
                        ),
                        ["dedupe_key"],
                    )
                event.dispatched_at = utcnow()

    def claim(self):
        now = utcnow()
        with self.platform.db.transaction() as session:
            # An external effect may have reached its provider before the worker died.
            session.execute(
                update(Job)
                .where(
                    Job.status == "running",
                    Job.lease_until < now,
                    Job.external.is_(True),
                )
                .values(status="unknown_outcome", last_error="lease_expired", lease_token=None)
            )
            # A crash on the final local attempt must not strand a running job forever.
            session.execute(
                update(Job)
                .where(
                    Job.status == "running",
                    Job.lease_until < now,
                    Job.attempts >= Job.max_attempts,
                )
                .values(status="failed", last_error="lease_expired", lease_token=None)
            )
            eligible = and_(
                Job.module.in_(self.modules),
                Job.available_at <= now,
                Job.attempts < Job.max_attempts,
                or_(Job.status == "queued", and_(Job.status == "running", Job.lease_until < now)),
            )
            query = select(Job).where(eligible)
            if not self.platform.settings.external_jobs_enabled:
                query = query.where(Job.external.is_(False))
            selected = session.scalar(
                query.order_by(Job.available_at, Job.id).limit(1).with_for_update(skip_locked=True)
            )
            if not selected:
                return None
            handler = self.handlers.get(selected.type)
            lease_seconds = (
                handler.lease_seconds
                if handler and handler.lease_seconds
                else self.platform.settings.lease_seconds
            )
            # The conditional update also fences the SQLite test adapter's unlocked SELECT.
            return session.execute(
                update(Job)
                .where(Job.id == selected.id, eligible)
                .values(
                    status="running",
                    attempts=Job.attempts + 1,
                    lease_token=new_id(),
                    lease_until=now + timedelta(seconds=lease_seconds),
                )
                .returning(Job)
            ).scalar_one_or_none()

    def process(self, claimed):
        try:
            with self.platform.db.transaction() as session:
                job = session.scalar(
                    select(Job)
                    .where(
                        Job.id == claimed.id,
                        Job.lease_token == claimed.lease_token,
                        Job.status == "running",
                        Job.lease_until > utcnow(),
                    )
                    .with_for_update()
                )
                if job is None:
                    return
                ctx = context_for_session(session, job.session_id, job.correlation_id)
                if ctx.actor_id != job.actor_id:
                    raise AppError("forbidden", "Job actor no longer matches the session.", 403)
                if job.type == "platform.event.v1":
                    registration = self.subscriptions.get(job.payload.get("consumer"))
                    if registration is None:
                        raise AppError("unknown_consumer", "No compatible consumer is registered.")
                    module, sub = registration
                    ctx.require(sub.required_scope)
                    event = session.get(Outbox, job.payload["eventId"])
                    if (
                        event is None
                        or event.actor_id != ctx.actor_id
                        or event.type != sub.event_type
                    ):
                        raise AppError("invalid_event", "The event is unavailable or incompatible.")
                    if insert_once(
                        session,
                        Receipt.__table__,
                        dict(
                            consumer=sub.consumer,
                            event_id=event.id,
                        ),
                        ["consumer", "event_id"],
                    ):
                        sub.handler(session, ctx, event)
                    job.status, job.lease_token, job.lease_until = "completed", None, None
                    return
                handler = self.handlers.get(job.type)
                if handler is None:
                    raise AppError("unknown_job_type", "No compatible job handler is registered.")
                ctx.require(handler.required_scope)
                if handler.external != job.external:
                    raise AppError("invalid_job_policy", "Job external-effect policy mismatch.")
            # Application job handlers own their short transactions; no DB lock across network I/O.
            handler.handle(ctx, claimed.payload, claimed.id)
            self.finish(claimed, "completed", None)
        except AppError as exc:
            self.finish(
                claimed,
                ("unknown_outcome" if claimed.external else "queued")
                if exc.retryable
                else "failed",
                exc.code,
            )
        except Exception:
            # Provider exceptions may embed credentials or source text. Never log their messages.
            log.error("job_failed job_id=%s correlation_id=%s", claimed.id, claimed.correlation_id)
            self.finish(
                claimed, "unknown_outcome" if claimed.external else "queued", "handler_failed"
            )

    def finish(self, claimed, status, error):
        with self.platform.db.transaction() as session:
            if status == "queued" and claimed.attempts >= claimed.max_attempts:
                status = "failed"
            session.execute(
                update(Job)
                .where(
                    Job.id == claimed.id,
                    Job.lease_token == claimed.lease_token,
                    Job.status == "running",
                    Job.lease_until > utcnow(),
                )
                .values(
                    status=status,
                    last_error=error,
                    lease_token=None,
                    lease_until=None,
                    available_at=utcnow() + timedelta(seconds=min(300, 2**claimed.attempts)),
                )
            )

    def heartbeat(self):
        with self.platform.db.transaction() as session:
            row = session.get(Heartbeat, self.id)
            if row:
                row.at = utcnow()
            else:
                session.add(Heartbeat(id=self.id, at=utcnow()))

    def tick(self) -> bool:
        self.heartbeat()
        for maintain in self.maintenance:
            maintain()
        self.dispatch()
        job = self.claim()
        if job:
            self.process(job)
        return job is not None
