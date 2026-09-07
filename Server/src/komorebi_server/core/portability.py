"""Explicit allowlist for portable platform records; session and credential material stays out."""

from sqlalchemy import select

from komorebi_server.core.models import AIRun, Audit, Notification, Preference


def export_platform(db, ctx):
    ctx.require("*")
    from datetime import datetime

    def scalar(value):
        return value.isoformat() if isinstance(value, datetime) else value

    result = {}
    with db.transaction() as session:
        for model, owner_field in (
            (Preference, Preference.user_id),
            (Notification, Notification.user_id),
            (AIRun, AIRun.user_id),
            (Audit, Audit.actor_id),
        ):
            result[model.__tablename__] = [
                {
                    column.name: scalar(getattr(row, column.name))
                    for column in model.__table__.columns
                }
                for row in session.scalars(select(model).where(owner_field == ctx.actor_id))
            ]
    return result
