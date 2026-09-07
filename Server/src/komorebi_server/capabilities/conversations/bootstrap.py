from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import Field
from sqlalchemy import select

from komorebi_server.capabilities.conversations.models import Message, Thread
from komorebi_server.core.http import IdempotencyKey, revision
from komorebi_server.core.identity import context_for_session, get_context
from komorebi_server.core.jobs import enqueue
from komorebi_server.core.modules import JobHandler, Module
from komorebi_server.core.transactions import command, record_change
from komorebi_server.shared.contracts.common import (
    AppError,
    Completed,
    Contract,
    Pending,
    RequestContext,
    Snapshot,
)

Context = Annotated[RequestContext, Depends(get_context)]


class ThreadDraft(Contract):
    title: str = Field(min_length=1, max_length=200)


class ThreadView(ThreadDraft):
    id: str
    revision: int
    created_at: datetime


class MessageDraft(Contract):
    content: str = Field(min_length=1, max_length=20000)


class MessageView(MessageDraft):
    id: str
    thread_id: str
    sequence: int
    role: Literal["user", "assistant"]
    created_at: datetime


def dto(model, row):
    return model.model_validate({k: getattr(row, k) for k in model.model_fields})


def owned(session, ctx, thread_id, lock=False):
    query = select(Thread).where(Thread.id == thread_id, Thread.user_id == ctx.actor_id)
    row = session.scalar(query.with_for_update() if lock else query)
    if row is None:
        raise AppError("not_found", "Conversation not found.", 404)
    return row


def create_module(platform):
    router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])

    @router.post("/threads", response_model=Completed[ThreadView], status_code=201)
    def create_thread(draft: ThreadDraft, ctx: Context, key: IdempotencyKey):
        ctx.require("conversations:write")
        with platform.db.transaction() as session:

            def execute():
                row = Thread(user_id=ctx.actor_id, title=draft.title)
                session.add(row)
                session.flush()
                return Completed(value=dto(ThreadView, row)).model_dump(mode="json", by_alias=True)

            return command(session, ctx, "conversations.create", key, draft.model_dump(), execute)

    @router.get("/threads", response_model=Snapshot[list[ThreadView]])
    def threads(
        ctx: Context, limit: Annotated[int, Query(ge=1, le=100)] = 50, cursor: UUID | None = None
    ):
        ctx.require("conversations:read")
        with platform.db.transaction() as session:
            query = select(Thread).where(Thread.user_id == ctx.actor_id)
            if cursor:
                query = query.where(Thread.id > str(cursor))
            rows = session.scalars(query.order_by(Thread.id).limit(limit + 1)).all()
            return Snapshot(
                data=[dto(ThreadView, r) for r in rows[:limit]],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    @router.get("/threads/{thread_id}/messages", response_model=Snapshot[list[MessageView]])
    def messages(
        thread_id: UUID,
        ctx: Context,
        after: Annotated[int, Query(ge=0)] = 0,
        limit: Annotated[int, Query(ge=1, le=100)] = 50,
    ):
        ctx.require("conversations:read")
        with platform.db.transaction() as session:
            owned(session, ctx, str(thread_id))
            rows = session.scalars(
                select(Message)
                .where(
                    Message.thread_id == str(thread_id),
                    Message.user_id == ctx.actor_id,
                    Message.sequence > after,
                )
                .order_by(Message.sequence)
                .limit(limit + 1)
            ).all()
            return Snapshot(
                data=[dto(MessageView, r) for r in rows[:limit]],
                next_cursor=str(rows[limit - 1].sequence) if len(rows) > limit else None,
            )

    @router.post("/threads/{thread_id}/messages", response_model=Pending, status_code=202)
    def send(
        thread_id: UUID,
        draft: MessageDraft,
        ctx: Context,
        key: IdempotencyKey,
        expected: Annotated[int, Depends(revision)],
    ):
        ctx.require("conversations:write")
        ctx.require("ai:execute")
        with platform.db.transaction() as session:

            def execute():
                thread = owned(session, ctx, str(thread_id), lock=True)
                if thread.revision != expected:
                    raise AppError("revision_conflict", "Reload the conversation before sending.")
                thread.revision += 1
                row = Message(
                    user_id=ctx.actor_id,
                    thread_id=thread.id,
                    sequence=thread.revision,
                    role="user",
                    content=draft.content,
                )
                session.add(row)
                session.flush()
                job_id = enqueue(
                    session,
                    ctx,
                    "conversations",
                    "conversations.reply.v1",
                    {"threadId": thread.id, "revision": thread.revision},
                    f"reply:{row.id}",
                    external=True,
                )
                record_change(
                    session,
                    ctx,
                    "conversations",
                    "conversations.messageChanged.v1",
                    thread.id,
                    thread.revision,
                )
                return Pending(
                    operation_id=job_id, poll_url=f"/api/v1/core/jobs/{job_id}"
                ).model_dump(mode="json", by_alias=True)

            return command(
                session,
                ctx,
                f"conversations.send:{thread_id}",
                key,
                {"content": draft.content, "revision": expected},
                execute,
            )

    def reply(ctx, payload, job_id):
        ctx.require("conversations:read")
        with platform.db.transaction() as session:
            thread = owned(session, ctx, payload["threadId"])
            if session.scalar(select(Message.id).where(Message.run_id == job_id)):
                return  # Acknowledgement was lost after the reply transaction committed.
            if thread.revision != payload["revision"]:
                raise AppError("stale_input", "Conversation changed before AI execution.")
            previous_run = platform.ai.has_run(job_id)
            if previous_run:
                raise AppError("ai_reconciliation_required", "An interrupted AI run needs review.")
            rows = session.scalars(
                select(Message)
                .where(
                    Message.thread_id == thread.id,
                    Message.user_id == ctx.actor_id,
                )
                .order_by(Message.sequence.desc())
                .limit(20)
            ).all()
            context = [{"role": r.role, "content": r.content} for r in reversed(rows)]
        result = platform.ai.generate(ctx, job_id, context)
        with platform.db.transaction() as session:
            # Reauthorize and recheck revision after external I/O before persisting any output.
            current = context_for_session(session, ctx.session_id, ctx.correlation_id)
            current.require("conversations:write")
            thread = owned(session, current, payload["threadId"], lock=True)
            if thread.revision != payload["revision"]:
                raise AppError("stale_input", "Conversation changed during AI execution.")
            thread.revision += 1
            session.add(
                Message(
                    user_id=ctx.actor_id,
                    thread_id=thread.id,
                    sequence=thread.revision,
                    role="assistant",
                    content=result.text,
                    run_id=job_id,
                )
            )
            record_change(
                session,
                ctx,
                "conversations",
                "conversations.messageChanged.v1",
                thread.id,
                thread.revision,
            )

    def export(ctx):
        ctx.require("conversations:read")
        with platform.db.transaction() as session:
            return {
                "threads": [
                    dto(ThreadView, r).model_dump(mode="json", by_alias=True)
                    for r in session.scalars(select(Thread).where(Thread.user_id == ctx.actor_id))
                ],
                "messages": [
                    dto(MessageView, r).model_dump(mode="json", by_alias=True)
                    for r in session.scalars(select(Message).where(Message.user_id == ctx.actor_id))
                ],
            }

    return Module(
        name="conversations",
        schema="conversations",
        router=router,
        provides=("conversations.history",),
        permissions=("conversations:read", "conversations:write"),
        jobs={"conversations.reply.v1": JobHandler(reply, "ai:execute", external=True)},
        export=export,
    )
