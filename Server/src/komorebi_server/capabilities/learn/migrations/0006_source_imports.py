"""Temporary PDF inputs and OCR results, separate from saved learning."""

import sqlalchemy as sa
from alembic import op

revision = "0006_source_imports"
down_revision = "0005_learn"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "source_imports",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("filename", sa.String(300), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=True),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error", sa.String(500), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        schema="learn",
    )
    for column in ("user_id", "expires_at"):
        op.create_index(
            f"ix_learn_source_imports_{column}", "source_imports", [column], schema="learn"
        )


def downgrade():
    op.drop_table("source_imports", schema="learn")
