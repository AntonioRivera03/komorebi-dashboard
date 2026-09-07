from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from komorebi_server.capabilities.tasks.service import Tasks
from komorebi_server.core.http import IdempotencyKey, revision
from komorebi_server.core.identity import get_context
from komorebi_server.core.modules import Module
from komorebi_server.shared.contracts.common import Completed, RequestContext, Snapshot
from komorebi_server.shared.contracts.tasks import TaskChangeView, TaskDraft, TaskView

Context = Annotated[RequestContext, Depends(get_context)]
Revision = Annotated[int, Depends(revision)]


def create_module(platform):
    service = Tasks(platform)
    router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])

    @router.get("", response_model=Snapshot[list[TaskView]])
    def list_tasks(
        ctx: Context,
        limit: Annotated[int, Query(ge=1, le=100)] = 50,
        cursor: UUID | None = None,
        status: Literal["open", "in_progress", "completed", "canceled"] | None = None,
    ):
        return service.list(ctx, status, limit, str(cursor) if cursor else None)

    @router.post("", response_model=Completed[TaskView], status_code=201)
    def create_task(draft: TaskDraft, ctx: Context, key: IdempotencyKey):
        return service.create(ctx, draft, key)

    @router.get("/{task_id}", response_model=Snapshot[TaskView])
    def get_task(task_id: UUID, ctx: Context):
        return service.get(ctx, str(task_id))

    @router.get("/{task_id}/history", response_model=Snapshot[list[TaskChangeView]])
    def history(
        task_id: UUID,
        ctx: Context,
        limit: Annotated[int, Query(ge=1, le=100)] = 50,
        cursor: UUID | None = None,
    ):
        return service.history(ctx, str(task_id), limit, str(cursor) if cursor else None)

    @router.put("/{task_id}", response_model=Completed[TaskView])
    def update_task(
        task_id: UUID, draft: TaskDraft, ctx: Context, key: IdempotencyKey, expected: Revision
    ):
        return service.change(ctx, str(task_id), expected, key, "updated", draft)

    @router.post("/{task_id}/{action}", response_model=Completed[TaskView])
    def transition(
        task_id: UUID,
        action: Literal["complete", "reopen", "cancel"],
        ctx: Context,
        key: IdempotencyKey,
        expected: Revision,
    ):
        kind = {"complete": "completed", "reopen": "reopened", "cancel": "canceled"}[action]
        return service.change(ctx, str(task_id), expected, key, kind)

    return Module(
        name="tasks",
        schema="tasks",
        router=router,
        provides=("tasks.reader",),
        permissions=("tasks:read", "tasks:write"),
        export=service.export,
    )
