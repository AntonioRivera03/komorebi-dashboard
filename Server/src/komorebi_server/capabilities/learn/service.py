from sqlalchemy import update

from komorebi_server.capabilities.learn.models import LearningWorkspace
from komorebi_server.core.database import insert_once
from komorebi_server.core.transactions import command, record_change
from komorebi_server.shared.contracts.common import AppError, Completed, Snapshot, utcnow
from komorebi_server.shared.contracts.learn import LearnWorkspace, WorkspaceSaved, WorkspaceView


def check_preserved(previous, next_data):
    # Source locations and recorded attempts must remain resolvable. Whole-workspace
    # deletion is a separate, explicit operation, never an incidental stale autosave.
    for name in ("highlights", "reviews", "quizAttempts", "focusLog"):
        updated = {item["id"]: item for item in next_data[name]}
        for item in previous.get(name, []):
            if updated.get(item["id"]) != item:
                raise AppError("history_conflict", "Recorded history must be preserved.")
    sources = {m["id"]: m for m in next_data["materials"]}
    for m in previous.get("materials", []):
        if m["kind"] == "source" and sources.get(m["id"]) != m:
            raise AppError(
                "source_conflict", "Keep original sources unchanged; add a new source version."
            )
    drafts = {d["id"]: d for d in next_data["deckDrafts"]}
    for d in previous.get("deckDrafts", []):
        if d.get("publishedDeckId") and drafts.get(d["id"]) != d:
            raise AppError("draft_conflict", "A published draft is immutable.")


class Learn:
    def __init__(self, platform):
        self.platform = platform

    def get(self, ctx):
        ctx.require("learn:read")
        with self.platform.db.transaction() as session:
            row = session.get(LearningWorkspace, ctx.actor_id)
            return Snapshot(
                data=WorkspaceView(
                    revision=row.revision if row else 0,
                    workspace=LearnWorkspace.model_validate(row.data if row else {}),
                )
            )

    def save(self, ctx, draft, expected, key, *, deleting=False):
        ctx.require("learn:write")
        data = draft.model_dump(mode="json", by_alias=True, exclude_none=True)
        with self.platform.db.transaction() as session:

            def execute():
                insert_once(
                    session,
                    LearningWorkspace.__table__,
                    {"user_id": ctx.actor_id, "revision": 0, "data": {}},
                    ["user_id"],
                )
                row = session.get(LearningWorkspace, ctx.actor_id)
                if row.revision != expected:
                    raise AppError(
                        "revision_conflict",
                        "Learning changed elsewhere. Export your unsaved copy, then reload.",
                    )
                if not deleting:
                    check_preserved(row.data, data)
                revision = session.execute(
                    update(LearningWorkspace)
                    .where(
                        LearningWorkspace.user_id == ctx.actor_id,
                        LearningWorkspace.revision == expected,
                    )
                    .values(revision=expected + 1, data=data, updated_at=utcnow())
                    .returning(LearningWorkspace.revision)
                ).scalar_one_or_none()
                if revision is None:
                    raise AppError(
                        "revision_conflict",
                        "Learning changed in another session. Reload before saving.",
                    )
                record_change(
                    session,
                    ctx,
                    "learn",
                    "learn.workspaceDeleted.v1" if deleting else "learn.workspaceSaved.v1",
                    ctx.actor_id,
                    revision,
                )
                return Completed(value=WorkspaceSaved(revision=revision)).model_dump(
                    mode="json", by_alias=True
                )

            return command(
                session,
                ctx,
                "learn.delete" if deleting else "learn.save",
                key,
                {"revision": expected, "workspace": data},
                execute,
            )

    def export(self, ctx):
        return self.get(ctx).data.model_dump(mode="json", by_alias=True)
