"""Domain-neutral wire contracts; never import persistence or implementations here."""

from datetime import UTC, datetime
from typing import Generic, Literal, TypeVar
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


def utcnow() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid4())


class Contract(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class ResourceRef(Contract):
    owner: str
    kind: str
    id: str
    revision: int | None = None


class RequestContext(Contract):
    model_config = ConfigDict(frozen=True, alias_generator=to_camel, populate_by_name=True)
    actor_id: str
    session_id: str
    principal: Literal["user", "display", "job"]
    scopes: tuple[str, ...]
    correlation_id: str

    def require(self, scope: str) -> None:
        if "*" not in self.scopes and scope not in self.scopes:
            raise AppError("forbidden", "This session does not have the required scope.", 403)


T = TypeVar("T")


class Snapshot(Contract, Generic[T]):
    data: T
    observed_at: datetime = Field(default_factory=utcnow)
    freshness: Literal["current", "stale", "unknown"] = "current"
    next_cursor: str | None = None


class Completed(Contract, Generic[T]):
    status: Literal["completed"] = "completed"
    value: T


class Pending(Contract):
    status: Literal["pending"] = "pending"
    operation_id: str
    poll_url: str


class ErrorBody(Contract):
    code: str
    message: str
    correlation_id: str
    retryable: bool = False


class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 409, retryable: bool = False):
        super().__init__(message)
        self.code, self.message, self.status, self.retryable = code, message, status, retryable
