"""Tasks-owned public DTOs. Other modules may consume these, never Task ORM objects."""

from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, Field, field_validator

from komorebi_server.shared.contracts.common import Contract


class TaskDraft(Contract):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=20000)
    due_at: AwareDatetime | None = None
    estimate_minutes: int | None = Field(default=None, ge=1, le=10080)
    effort: Literal["light", "medium", "deep"] | None = None
    context: str | None = Field(default=None, max_length=100)
    priority: bool = False

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value):
        if not value.strip():
            raise ValueError("Title cannot be blank")
        return value.strip()


class TaskView(TaskDraft):
    id: str
    status: Literal["open", "in_progress", "completed", "canceled"]
    revision: int
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class TaskChangeView(Contract):
    id: str
    task_id: str
    kind: str
    revision: int
    at: datetime
