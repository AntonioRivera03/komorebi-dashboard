"""Bounded Learn authoring aggregate, independent of Tasks and Conversations."""

import sqlalchemy as sa
from alembic import op

revision = "0005_learn"
down_revision = "0004_conversations"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS learn")
    op.create_table(
        "learning_workspaces",
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("revision >= 0"),
        sa.PrimaryKeyConstraint("user_id"),
        schema="learn",
    )


def downgrade():
    op.drop_table("learning_workspaces", schema="learn")
    op.execute("DROP SCHEMA learn")
