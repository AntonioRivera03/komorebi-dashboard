from sqlalchemy import select

from komorebi_server.capabilities.tasks.models import Task, TaskChange
from komorebi_server.core.transactions import command, record_change
from komorebi_server.shared.contracts.common import AppError, Completed, Snapshot, utcnow
from komorebi_server.shared.contracts.tasks import TaskChangeView, TaskDraft, TaskView


def view(row: Task) -> TaskView:
    return TaskView.model_validate({k: getattr(row, k) for k in TaskView.model_fields})


def owned(session, ctx, task_id, *, lock=False):
    query = select(Task).where(
        Task.id == task_id, Task.user_id == ctx.actor_id, Task.deleted_at.is_(None)
    )
    row = session.scalar(query.with_for_update() if lock else query)
    if row is None:
        raise AppError("not_found", "Task not found.", 404)
    return row


class Tasks:
    def __init__(self, platform):
        self.platform = platform

    def list(self, ctx, status=None, limit=50, cursor=None):
        ctx.require("tasks:read")
        with self.platform.db.transaction() as session:
            query = select(Task).where(Task.user_id == ctx.actor_id, Task.deleted_at.is_(None))
            if status:
                query = query.where(Task.status == status)
            if cursor:
                query = query.where(Task.id > cursor)
            rows = session.scalars(query.order_by(Task.id).limit(limit + 1)).all()
            return Snapshot(
                data=[view(t) for t in rows[:limit]],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    def get(self, ctx, task_id):
        ctx.require("tasks:read")
        with self.platform.db.transaction() as session:
            return Snapshot(data=view(owned(session, ctx, task_id)))

    def history(self, ctx, task_id, limit=50, cursor=None):
        ctx.require("tasks:read")
        with self.platform.db.transaction() as session:
            owned(session, ctx, task_id)
            query = select(TaskChange).where(
                TaskChange.task_id == task_id, TaskChange.user_id == ctx.actor_id
            )
            if cursor:
                query = query.where(TaskChange.id > cursor)
            rows = session.scalars(query.order_by(TaskChange.id).limit(limit + 1)).all()
            return Snapshot(
                data=[
                    TaskChangeView.model_validate(
                        {k: getattr(row, k) for k in TaskChangeView.model_fields}
                    )
                    for row in rows[:limit]
                ],
                next_cursor=rows[limit - 1].id if len(rows) > limit else None,
            )

    def create(self, ctx, draft: TaskDraft, key):
        ctx.require("tasks:write")
        with self.platform.db.transaction() as session:

            def execute():
                task = Task(user_id=ctx.actor_id, **draft.model_dump())
                session.add(task)
                session.flush()
                self.changed(session, ctx, task, "created")
                return Completed(value=view(task)).model_dump(mode="json", by_alias=True)

            return command(
                session, ctx, "tasks.create", key, draft.model_dump(mode="json"), execute
            )

    def change(self, ctx, task_id, expected_revision, key, action, draft=None):
        ctx.require("tasks:write")
        with self.platform.db.transaction() as session:

            def execute():
                task = owned(session, ctx, task_id, lock=True)
                if task.revision != expected_revision:
                    raise AppError("revision_conflict", "Reload the task before changing it.")
                if action == "updated":
                    for field, value in draft.model_dump().items():
                        setattr(task, field, value)
                else:
                    status = {"completed": "completed", "reopened": "open", "canceled": "canceled"}
                    task.status = status[action]
                    task.completed_at = utcnow() if action == "completed" else None
                task.revision += 1
                task.updated_at = utcnow()
                self.changed(session, ctx, task, action)
                return Completed(value=view(task)).model_dump(mode="json", by_alias=True)

            owned(session, ctx, task_id)
            return command(
                session,
                ctx,
                f"tasks.{action}:{task_id}",
                key,
                {
                    "revision": expected_revision,
                    "draft": draft.model_dump(mode="json") if draft else None,
                },
                execute,
            )

    @staticmethod
    def changed(session, ctx, task, kind):
        session.add(
            TaskChange(user_id=ctx.actor_id, task_id=task.id, kind=kind, revision=task.revision)
        )
        record_change(
            session, ctx, "tasks", "tasks.taskChanged.v1", task.id, task.revision, {"kind": kind}
        )

    def export(self, ctx):
        ctx.require("tasks:read")
        with self.platform.db.transaction() as session:
            return [
                view(t).model_dump(mode="json", by_alias=True)
                for t in session.scalars(
                    select(Task).where(Task.user_id == ctx.actor_id, Task.deleted_at.is_(None))
                )
            ]
