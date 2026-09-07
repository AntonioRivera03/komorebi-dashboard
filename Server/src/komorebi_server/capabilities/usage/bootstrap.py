from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import String, select
from sqlalchemy.orm import Mapped, mapped_column

from komorebi_server.core.database import Base, UTCDateTime
from komorebi_server.core.identity import owner
from komorebi_server.core.modules import Module, Subscription
from komorebi_server.shared.contracts.common import (
    Contract,
    RequestContext,
    Snapshot,
    new_id,
    utcnow,
)


class Observation(Base):
    __tablename__ = "observations"
    __table_args__ = {"schema": "usage"}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    event_id: Mapped[str] = mapped_column(String(36), unique=True)
    kind: Mapped[str] = mapped_column(String(150))
    resource_id: Mapped[str] = mapped_column(String(36))
    revision: Mapped[int]
    at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class ObservationView(Contract):
    id: str
    kind: str
    resource_id: str
    revision: int
    at: datetime


def observe(session, ctx, event):
    # Immutable fact history, not a mutable projection. No business content is copied.
    session.add(
        Observation(
            user_id=ctx.actor_id,
            event_id=event.id,
            kind=event.type,
            resource_id=event.aggregate_id,
            revision=event.aggregate_revision,
        )
    )


def create_module(platform):
    router = APIRouter(prefix="/api/v1/usage", tags=["usage"])

    @router.get("/observations", response_model=Snapshot[list[ObservationView]])
    def observations(
        ctx: Annotated[RequestContext, Depends(owner)],
        limit: Annotated[int, Query(ge=1, le=100)] = 50,
        cursor: UUID | None = None,
    ):
        with platform.db.transaction() as session:
            query = select(Observation).where(Observation.user_id == ctx.actor_id)
            if cursor:
                query = query.where(Observation.id > str(cursor))
            rows = session.scalars(query.order_by(Observation.id).limit(limit + 1)).all()
            return Snapshot(
                data=[
                    ObservationView.model_validate(
                        {k: getattr(r, k) for k in ObservationView.model_fields}
                    )
                    for r in rows[:limit]
                ],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    def export(ctx):
        ctx.require("usage:read")
        with platform.db.transaction() as session:
            return [
                ObservationView.model_validate(
                    {k: getattr(r, k) for k in ObservationView.model_fields}
                ).model_dump(mode="json", by_alias=True)
                for r in session.scalars(
                    select(Observation).where(Observation.user_id == ctx.actor_id)
                )
            ]

    return Module(
        name="usage",
        schema="usage",
        router=router,
        provides=("usage.observations",),
        subscriptions=(
            Subscription("tasks.taskChanged.v1", "usage.tasks.v1", observe, "tasks:read"),
            Subscription(
                "conversations.messageChanged.v1", "usage.chat.v1", observe, "conversations:read"
            ),
        ),
        export=export,
    )
